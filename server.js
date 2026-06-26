// src/server.js  — LUMEVA Backend
'use strict';

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Allow requests with no origin (curl, Postman, same-origin file://)
    if (!origin) return cb(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Serve frontend static files ───────────────────────────────────────
// When deployed, backend serves the frontend HTML files too.
// Put all your HTML/CSS/JS files in a "public" folder alongside this server.
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'LUMEVA API', ts: new Date().toISOString() }));

// ── API Routes ────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/delivery',   require('./routes/delivery'));
app.use('/api/promo',      require('./routes/promo'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/mpesa',      require('./routes/mpesa'));

// ── 404 handler ───────────────────────────────────────────────────────
app.use('/api/*', (_, res) => res.status(404).json({ success: false, error: 'Route not found.' }));

// ── SPA fallback — serve index.html for all non-API routes ───────────
app.get('*', (req, res) => {
  const file = path.join(publicDir, req.path.endsWith('.html') ? req.path : `${req.path}.html`);
  const fallback = path.join(publicDir, 'index.html');
  res.sendFile(file, err => { if (err) res.sendFile(fallback, err2 => { if (err2) res.status(404).send('Not found'); }); });
});

// ── Global error handler ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   LUMEVA Backend  ·  Port ${PORT}       ║
  ║   http://localhost:${PORT}/api/         ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
