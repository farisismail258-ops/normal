'use strict';

const express = require('express');
const db      = require('./database');
const router  = express.Router();

router.post('/subscribe', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@'))
      return res.status(400).json({ success: false, error: 'Valid email required.' });

    const existing = db.prepare('SELECT id FROM newsletter WHERE email = ?').get(email.toLowerCase().trim());
    if (existing)
      return res.json({ success: true, data: { message: 'Already subscribed!' } });

    db.prepare('INSERT INTO newsletter (email) VALUES (?)').run(email.toLowerCase().trim());
    res.json({ success: true, data: { message: 'Subscribed! Welcome to LUMEVA.' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
