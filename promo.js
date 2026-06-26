// src/routes/promo.js
'use strict';

const express = require('express');
const db      = require('../db/database');
const router  = express.Router();

// POST /api/promo/validate
router.post('/validate', (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Code required.' });

    const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND active = 1').get(code.trim().toUpperCase());
    if (!promo) return res.status(404).json({ success: false, error: 'Invalid or expired promo code.' });

    res.json({ success: true, data: { code: promo.code, pct: promo.pct, desc: promo.desc } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
