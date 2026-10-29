const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, (req, res) => res.json(req.user));

// Every auction the user has bid on, with their best bid and whether they lead.
router.get('/me/bids', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.title, a.location, a.ends_at,
              MAX(mine.amount) AS my_highest,
              (SELECT MAX(amount) FROM bids WHERE auction_id = a.id) AS current_bid,
              CASE
                WHEN UTC_TIMESTAMP() < a.starts_at THEN 'upcoming'
                WHEN UTC_TIMESTAMP() > a.ends_at  THEN 'closed'
                ELSE 'live'
              END AS status
       FROM bids mine
       JOIN auctions a ON a.id = mine.auction_id
       WHERE mine.user_id = ?
       GROUP BY a.id
       ORDER BY a.ends_at ASC`,
      [req.user.id]
    );
    return res.json(rows.map((r) => ({ ...r, leading: r.my_highest === r.current_bid })));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
