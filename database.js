'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const dbPath   = process.env.DB_PATH || './lumeva.db';

const db = new Database(path.resolve(dbPath));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    brand         TEXT,
    category      TEXT,
    price         REAL NOT NULL,
    compare_at    REAL,
    image         TEXT,
    images        TEXT,
    tags          TEXT,
    badge         TEXT,
    description   TEXT,
    handle        TEXT UNIQUE,
    created_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    user_email      TEXT NOT NULL,
    first_name      TEXT,
    last_name       TEXT,
    address         TEXT,
    delivery_area   TEXT,
    payment_method  TEXT DEFAULT 'mpesa',
    mpesa_phone     TEXT,
    promo_code      TEXT,
    items           TEXT NOT NULL,
    subtotal        REAL NOT NULL,
    shipping_fee    REAL DEFAULT 0,
    discount        REAL DEFAULT 0,
    total           REAL NOT NULL,
    status          TEXT DEFAULT 'pending',
    mpesa_checkout_id TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS newsletter (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    code       TEXT PRIMARY KEY,
    pct        INTEGER NOT NULL,
    desc       TEXT,
    active     INTEGER DEFAULT 1,
    uses_left  INTEGER DEFAULT -1
  );
`);

const promoCount = db.prepare('SELECT COUNT(*) as n FROM promo_codes').get().n;
if (promoCount === 0) {
  const insert = db.prepare('INSERT OR IGNORE INTO promo_codes (code, pct, desc) VALUES (?, ?, ?)');
  [
    ['LUMEVA10',  10, '10% off your order'],
    ['BEAUTY15',  15, '15% off your order'],
    ['WELCOME20', 20, '20% welcome discount'],
    ['GLOW25',    25, '25% glow discount'],
    ['VIP30',     30, '30% VIP discount'],
  ].forEach(row => insert.run(...row));
}

module.exports = db;
