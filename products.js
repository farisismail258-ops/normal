'use strict';

const express = require('express');
const db      = require('./database');
const router  = express.Router();

router.get('/', (req, res) => {
  try {
    const { category, search, limit = 500 } = req.query;
    const data = db.products.all({ category, search, limit });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = db.products.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

router.post('/bulk', (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products))
      return res.status(400).json({ success: false, error: 'Expected array of products.' });
    const count = db.products.bulkInsert(products);
    res.json({ success: true, data: { imported: count } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
