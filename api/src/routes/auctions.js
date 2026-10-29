const express = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Status is derived from start/end times so it never goes stale.
const SELECT_AUCTIONS = `
  SELECT a.*,
         COALESCE(MAX(b.amount), a.starting_price) AS current_bid,
         COUNT(b.id) AS bid_count,
         CASE
           WHEN UTC_TIMESTAMP() < a.starts_at THEN 'upcoming'
           WHEN UTC_TIMESTAMP() > a.ends_at  THEN 'closed'
           ELSE 'live'
         END AS status
  FROM auctions a
  LEFT JOIN bids b ON b.auction_id = a.id
`;

router.get('/', async (req, res, next) => {
  const { status } = req.query;
  if (status && !['upcoming', 'live', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'status must be upcoming, live or closed' });
  }
  try {
    const sql = `${SELECT_AUCTIONS} GROUP BY a.id ${status ? 'HAVING status = ?' : ''} ORDER BY a.ends_at ASC`;
    const [rows] = await pool.query(sql, status ? [status] : []);
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${SELECT_AUCTIONS} WHERE a.id = ? GROUP BY a.id`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Auction not found' });

    const [bids] = await pool.query(
      `SELECT b.id, b.amount, b.created_at, u.name AS bidder
       FROM bids b JOIN users u ON u.id = b.user_id
       WHERE b.auction_id = ? ORDER BY b.amount DESC LIMIT 20`,
      [req.params.id]
    );
    return res.json({ ...rows[0], bids });
  } catch (err) {
    return next(err);
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  const {
    title, description, location, property_type: propertyType,
    image_url: imageUrl, starting_price: startingPrice, bid_increment: bidIncrement,
    starts_at: startsAt, ends_at: endsAt,
  } = req.body || {};

  if (!title || !location || !startingPrice || !startsAt || !endsAt) {
    return res.status(400).json({ error: 'title, location, starting_price, starts_at and ends_at are required' });
  }
  if (new Date(endsAt) <= new Date(startsAt)) {
    return res.status(400).json({ error: 'ends_at must be after starts_at' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO auctions
        (title, description, location, property_type, image_url, starting_price, bid_increment, starts_at, ends_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, location, propertyType || 'Residential', imageUrl || null,
        startingPrice, bidIncrement || 10000, new Date(startsAt), new Date(endsAt), req.user.id]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/bids', requireAuth, async (req, res, next) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'A valid bid amount is required' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the auction row so two bidders can't both win the same increment.
    const [auctions] = await conn.query('SELECT * FROM auctions WHERE id = ? FOR UPDATE', [req.params.id]);
    const auction = auctions[0];
    if (!auction) {
      await conn.rollback();
      return res.status(404).json({ error: 'Auction not found' });
    }

    const now = new Date();
    if (now < new Date(auction.starts_at) || now > new Date(auction.ends_at)) {
      await conn.rollback();
      return res.status(409).json({ error: 'This auction is not open for bidding' });
    }

    const [[top]] = await conn.query('SELECT MAX(amount) AS highest FROM bids WHERE auction_id = ?', [auction.id]);
    const minimum = top.highest ? top.highest + auction.bid_increment : auction.starting_price;
    if (amount < minimum) {
      await conn.rollback();
      return res.status(400).json({ error: `Bid must be at least R ${minimum.toLocaleString('en-ZA')}`, minimum });
    }

    const [result] = await conn.query(
      'INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)',
      [auction.id, req.user.id, amount]
    );
    await conn.commit();
    return res.status(201).json({ id: result.insertId, amount });
  } catch (err) {
    await conn.rollback();
    return next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
