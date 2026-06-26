'use strict';

const express = require('express');
const db      = require('./database');
const router  = express.Router();

// Ensure reviews table exists
const Database = require('better-sqlite3');
// We use the same JSON db from database.js
// Add reviews to the db structure

// GET /api/reviews/:id  — get reviews for a store/driver
router.get('/:id', (req, res) => {
  try {
    const id      = req.params.id;
    const reviews = db.reviews ? db.reviews.get(id) : null;
    res.json({ success: true, data: reviews || { total: 0, count: 0, avg: 0, list: [] } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// POST /api/reviews/:id  — submit a review
router.post('/:id', (req, res) => {
  try {
    const id     = req.params.id;
    const { stars, name, text } = req.body;
    if (!stars || stars < 1 || stars > 5)
      return res.status(400).json({ success: false, error: 'Stars must be 1–5.' });

    db.reviews.add(id, { stars: parseInt(stars), name: name || '', text: text || '', ts: Date.now() });
    const data = db.reviews.get(id);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
