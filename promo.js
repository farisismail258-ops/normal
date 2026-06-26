'use strict';

const express = require('express');
const db      = require('./database');
const router  = express.Router();

router.post('/validate', (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Code required.' });
    const promo = db.promos.findByCode(code.trim());
    if (!promo) return res.status(404).json({ success: false, error: 'Invalid or expired promo code.' });
    res.json({ success: true, data: { code: promo.code, pct: promo.pct, desc: promo.desc } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
