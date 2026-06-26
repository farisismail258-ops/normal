'use strict';

const express = require('express');
const db      = require('./database');
const router  = express.Router();

router.post('/subscribe', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@'))
      return res.status(400).json({ success: false, error: 'Valid email required.' });

    if (db.newsletter.findByEmail(email))
      return res.json({ success: true, data: { message: 'Already subscribed!' } });

    db.newsletter.insert({ email: email.toLowerCase().trim(), created_at: new Date().toISOString() });
    res.json({ success: true, data: { message: 'Subscribed! Welcome to LUMEVA.' } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
