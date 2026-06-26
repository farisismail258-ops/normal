'use strict';

const fs   = require('fs');
const path = require('path');

const DB_FILE = path.resolve(process.env.DB_PATH || './lumeva-db.json');

// Default structure
const defaults = {
  users:       [],
  products:    [],
  orders:      [],
  newsletter:  [],
  promo_codes: [
    { code: 'LUMEVA10',  pct: 10, desc: '10% off your order',    active: true },
    { code: 'BEAUTY15',  pct: 15, desc: '15% off your order',    active: true },
    { code: 'WELCOME20', pct: 20, desc: '20% welcome discount',  active: true },
    { code: 'GLOW25',    pct: 25, desc: '25% glow discount',     active: true },
    { code: 'VIP30',     pct: 30, desc: '30% VIP discount',      active: true },
  ],
};

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      // Merge — ensure all tables exist
      return { ...defaults, ...data };
    }
  } catch {}
  return { ...defaults };
}

function save(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('DB save error:', err.message);
  }
}

// In-memory store, persisted to JSON file
let _db = load();

const db = {
  // ── Users ──────────────────────────────────────────────────────────
  users: {
    findByEmail: email => _db.users.find(u => u.email === email.toLowerCase()),
    findById:    id    => _db.users.find(u => u.id === id),
    insert(user) {
      _db.users.push(user);
      save(_db);
    },
  },

  // ── Products ───────────────────────────────────────────────────────
  products: {
    all(filters = {}) {
      let list = [..._db.products];
      if (filters.category)
        list = list.filter(p => (p.category || '').toLowerCase() === filters.category.toLowerCase());
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(p =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
      }
      if (filters.limit) list = list.slice(0, parseInt(filters.limit));
      return list;
    },
    findById: id => _db.products.find(p => p.id === id || p.handle === id),
    bulkInsert(products) {
      let count = 0;
      for (const p of products) {
        const id = p.handle || p.id || (p.name || '').toLowerCase().replace(/\s+/g, '-');
        const existing = _db.products.findIndex(x => x.id === id);
        const product = {
          id,
          name:          p.name || '',
          brand:         p.brand || p.tagline || '',
          category:      p.category || '',
          price:         p.price || 0,
          compareAt:     p.compareAt || p.compare_at || p.originalPrice || null,
          originalPrice: p.compareAt || p.compare_at || p.originalPrice || null,
          image:         p.image || (Array.isArray(p.images) ? p.images[0] : null),
          images:        Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
          tags:          Array.isArray(p.tags) ? p.tags : [],
          badge:         p.badge || null,
          description:   p.description || null,
          handle:        p.handle || id,
        };
        if (existing > -1) _db.products[existing] = product;
        else _db.products.push(product);
        count++;
      }
      save(_db);
      return count;
    },
  },

  // ── Orders ─────────────────────────────────────────────────────────
  orders: {
    all:      ()  => [..._db.orders].reverse(),
    findById: id  => _db.orders.find(o => o.id === id),
    insert(order) {
      _db.orders.push(order);
      save(_db);
    },
  },

  // ── Newsletter ─────────────────────────────────────────────────────
  newsletter: {
    findByEmail: email => _db.newsletter.find(n => n.email === email.toLowerCase()),
    insert(entry) {
      _db.newsletter.push(entry);
      save(_db);
    },
  },

  // ── Promo codes ────────────────────────────────────────────────────
  promos: {
    findByCode: code => _db.promo_codes.find(p => p.code === code.toUpperCase() && p.active),
  },
};

module.exports = db;
