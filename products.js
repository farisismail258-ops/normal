// src/routes/products.js
'use strict';

const express = require('express');
const db      = require('../db/database');
const router  = express.Router();

function parseProduct(row) {
  if (!row) return null;
  return {
    ...row,
    price:      row.price,
    compareAt:  row.compare_at || null,
    originalPrice: row.compare_at || null,
    images:     row.images ? JSON.parse(row.images) : (row.image ? [row.image] : []),
    image:      row.image  || (row.images ? JSON.parse(row.images)[0] : null),
    tags:       row.tags   ? JSON.parse(row.tags)   : [],
  };
}

// GET /api/products
// ?limit=500&category=Skincare&search=toner&page=1&perPage=24
router.get('/', (req, res) => {
  try {
    const { category, search, limit = 500, page = 1, perPage = 500 } = req.query;
    let sql    = 'SELECT * FROM products WHERE 1=1';
    const args = [];

    if (category) {
      sql += ' AND LOWER(category) = LOWER(?)';
      args.push(category);
    }
    if (search) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(category) LIKE ? OR LOWER(tags) LIKE ?)';
      const q = `%${search.toLowerCase()}%`;
      args.push(q, q, q, q);
    }

    sql += ' ORDER BY rowid DESC';
    if (parseInt(limit) < 9999) {
      sql += ' LIMIT ?';
      args.push(parseInt(limit));
    }

    const rows = db.prepare(sql).all(...args);
    res.json({ success: true, data: rows.map(parseProduct) });
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM products WHERE id = ? OR handle = ?')
      .get(req.params.id, req.params.id);
    if (!row) return res.status(404).json({ success: false, error: 'Product not found.' });
    res.json({ success: true, data: parseProduct(row) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// POST /api/products/bulk  — import array of products
router.post('/bulk', (req, res) => {
  try {
    const products = req.body;
    if (!Array.isArray(products))
      return res.status(400).json({ success: false, error: 'Expected array of products.' });

    const insert = db.prepare(`
      INSERT OR REPLACE INTO products
        (id, name, brand, category, price, compare_at, image, images, tags, badge, description, handle)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction(prods => {
      let count = 0;
      for (const p of prods) {
        const id = p.handle || p.id || p.name.toLowerCase().replace(/\s+/g, '-');
        insert.run(
          id,
          p.name || '',
          p.brand || p.tagline || '',
          p.category || '',
          p.price || 0,
          p.compareAt || p.compare_at || p.originalPrice || null,
          p.image || (Array.isArray(p.images) ? p.images[0] : null),
          JSON.stringify(Array.isArray(p.images) ? p.images : (p.image ? [p.image] : [])),
          JSON.stringify(Array.isArray(p.tags)   ? p.tags   : []),
          p.badge || null,
          p.description || null,
          p.handle || id,
        );
        count++;
      }
      return count;
    });

    const count = insertMany(products);
    res.json({ success: true, data: { imported: count } });
  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
