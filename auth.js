'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const db       = require('./database');
const router   = express.Router();

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: 'Unauthorised' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalid or expired' });
  }
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });

    if (db.users.findByEmail(email))
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const id   = uuid();
    const user = { id, name: name.trim(), email: email.toLowerCase().trim(), password: hash, created_at: new Date().toISOString() };
    db.users.insert(user);

    const token = jwt.sign({ id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, data: { user: { id, name: user.name, email: user.email }, token } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password are required.' });

    const user = db.users.findByEmail(email);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email }, token } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

router.get('/me', authRequired, (req, res) => {
  const user = db.users.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
  const { password: _, ...safeUser } = user;
  res.json({ success: true, data: { user: safeUser } });
});

module.exports = router;
