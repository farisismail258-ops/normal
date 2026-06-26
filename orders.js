'use strict';

const express  = require('express');
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
    const order = {
      id: orderId, user_email: userEmail,
      first_name: firstName || '', last_name: lastName || '',
      address: address || '', delivery_area: deliveryArea || '',
      payment_method: paymentMethod || 'mpesa', mpesa_phone: mpesaPhone || '',
      promo_code: promoCode || '', items,
      subtotal: subtotal || 0, shipping_fee: shippingFee || 0,
      discount: discount || 0, total: total || 0,
      status: 'pending', created_at: new Date().toISOString(),
    };
    db.orders.insert(order);

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
    const order = db.orders.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

router.get('/', (req, res) => {
  try {
    res.json({ success: true, data: db.orders.all() });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

module.exports = router;
