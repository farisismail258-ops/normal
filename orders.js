'use strict';

const express  = require('express');
const { v4: uuid } = require('uuid');
const db       = require('./database');
const email    = require('./email');
const router   = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      email: userEmail, firstName, lastName, address, deliveryArea,
      paymentMethod, mpesaPhone, promoCode,
      items, subtotal, shippingFee, discount, total,
    } = req.body;

    if (!userEmail || !items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, error: 'Email and items are required.' });

    const orderId = `LMV-${Date.now().toString(36).toUpperCase()}`;

    db.prepare(`
      INSERT INTO orders
        (id, user_email, first_name, last_name, address, delivery_area,
         payment_method, mpesa_phone, promo_code, items,
         subtotal, shipping_fee, discount, total, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      orderId, userEmail, firstName || '', lastName || '', address || '', deliveryArea || '',
      paymentMethod || 'mpesa', mpesaPhone || '', promoCode || '',
      JSON.stringify(items),
      subtotal || 0, shippingFee || 0, discount || 0, total || 0,
    );

    email.sendOrderConfirmation({ email: userEmail, firstName, orderId, items, total, shippingFee, deliveryArea })
      .catch(err => console.warn('Email error:', err.message));

    res.json({ success: true, data: { orderId } });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });
    res.json({ success: true, data: { ...order, items: JSON.parse(order.items) } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

router.get('/', (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json({ success: true, data: orders.map(o => ({ ...o, items: JSON.parse(o.items) })) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
