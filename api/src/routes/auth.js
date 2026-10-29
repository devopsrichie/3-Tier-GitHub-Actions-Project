const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { signToken } = require('../middleware/auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res, next) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email address' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase(), hash]
    );
    const user = { id: result.insertId, name: name.trim(), email: email.toLowerCase(), role: 'bidder' };
    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
    return next(err);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const row = rows[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    return res.json({ token: signToken(user), user });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
