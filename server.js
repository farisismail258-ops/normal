'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'LUMEVA API', ts: new Date().toISOString() }));

app.use('/api/auth',       require('./auth'));
app.use('/api/products',   require('./products'));
app.use('/api/orders',     require('./orders'));
app.use('/api/delivery',   require('./delivery'));
app.use('/api/promo',      require('./promo'));
app.use('/api/newsletter', require('./newsletter'));
app.use('/api/mpesa',      require('./mpesa'));
app.use('/api/reviews',    require('./reviews'));

app.use('/api/*', (_, res) => res.status(404).json({ success: false, error: 'Route not found.' }));

app.use((err, req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ success: false, error: err.message || 'Internal server error.' });
});

const PORT = parseInt(process.env.PORT) || 5000;
app.listen(PORT, () => console.log(`LUMEVA API running on port ${PORT}`));

module.exports = app;
