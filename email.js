// src/services/email.js
'use strict';

const nodemailer = require('nodemailer');

function createTransport() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendOrderConfirmation({ email, firstName, orderId, items, total, shippingFee, deliveryArea }) {
  const transporter = createTransport();
  if (!transporter) {
    console.log('[Email] No credentials — skipping order confirmation for', orderId);
    return;
  }

  const itemsHtml = Array.isArray(items)
    ? items.map(i => `<tr>
        <td style="padding:6px 0;font-family:Inter,sans-serif;font-size:13px">${i.id}</td>
        <td style="padding:6px 0;text-align:right;font-family:Inter,sans-serif;font-size:13px">×${i.qty}</td>
      </tr>`).join('')
    : '';

  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#f4f1ea;font-family:Inter,sans-serif">
    <div style="max-width:560px;margin:40px auto;background:#fff;padding:40px">
      <h1 style="font-family:'Georgia',serif;font-weight:400;font-size:28px;margin:0 0 8px;color:#1a1a18">LUMEVA</h1>
      <p style="font-size:13px;color:#888;margin:0 0 32px">Premium K-beauty & Skincare, Kenya</p>

      <h2 style="font-size:18px;font-weight:500;color:#1a1a18;margin:0 0 8px">Order confirmed ✓</h2>
      <p style="font-size:14px;color:#555;margin:0 0 24px">
        Hi ${firstName || 'there'}, thank you for your order.<br>
        Your order reference is <strong>${orderId}</strong>.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        ${itemsHtml}
        <tr style="border-top:1px solid #eee">
          <td style="padding:10px 0;font-size:13px;color:#555">Delivery to ${deliveryArea || 'your area'}</td>
          <td style="padding:10px 0;text-align:right;font-size:13px;color:#555">KES ${(shippingFee||0).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:15px;font-weight:600;color:#1a1a18">Total</td>
          <td style="padding:6px 0;text-align:right;font-size:15px;font-weight:600;color:#1a1a18">KES ${(total||0).toLocaleString()}</td>
        </tr>
      </table>

      <p style="font-size:13px;color:#555;margin:0 0 8px">
        We'll notify you once your order is out for delivery. For any questions, reply to this email.
      </p>

      <p style="font-size:12px;color:#aaa;margin:32px 0 0">
        LUMEVA · Kenya's Premium Beauty Destination
      </p>
    </div>
  </body>
  </html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to:      email,
    subject: `Order confirmed — ${orderId} | LUMEVA`,
    html,
  });
  console.log('[Email] Order confirmation sent to', email);
}

async function sendWelcome({ email, name }) {
  const transporter = createTransport();
  if (!transporter) return;

  const html = `
  <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f1ea;font-family:Inter,sans-serif">
    <div style="max-width:560px;margin:40px auto;background:#fff;padding:40px">
      <h1 style="font-family:'Georgia',serif;font-weight:400;font-size:28px;margin:0 0 8px;color:#1a1a18">LUMEVA</h1>
      <p style="font-size:13px;color:#888;margin:0 0 32px">Premium K-beauty & Skincare, Kenya</p>
      <h2 style="font-size:18px;font-weight:500;color:#1a1a18;margin:0 0 8px">Welcome, ${name} ✦</h2>
      <p style="font-size:14px;color:#555;margin:0 0 24px">
        Your LUMEVA account is ready. Discover your skin ritual and shop Kenya's finest K-beauty.
      </p>
      <p style="font-size:12px;color:#aaa;margin:32px 0 0">LUMEVA · Kenya's Premium Beauty Destination</p>
    </div>
  </body></html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to:      email,
    subject: 'Welcome to LUMEVA ✦',
    html,
  });
}

module.exports = { sendOrderConfirmation, sendWelcome };
