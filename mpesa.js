'use strict';

const router = require('express').Router();


// ── Env vars (set these in Render dashboard) ──────────────────
const CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY    || '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const PASSKEY         = process.env.MPESA_PASSKEY         || '';
const SHORTCODE       = process.env.MPESA_SHORTCODE       || '174379';   // Daraja sandbox default
const CALLBACK_URL    = process.env.MPESA_CALLBACK_URL    || 'https://lumeva-backend-quqm.onrender.com/api/mpesa/callback';
const SANDBOX         = process.env.MPESA_SANDBOX !== 'false';           // true by default

const BASE = SANDBOX
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke';

// In-memory payment status store
const payments = {};

// ── Helpers ───────────────────────────────────────────────────
async function getAccessToken() {
  const creds = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res   = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Could not get M-Pesa access token');
  return data.access_token;
}

function timestamp() {
  return new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
}

function password(ts) {
  return Buffer.from(`${SHORTCODE}${PASSKEY}${ts}`).toString('base64');
}

function formatPhone(raw) {
  // Convert 07XXXXXXXX or +2547XXXXXXXX → 2547XXXXXXXX
  const n = String(raw).replace(/\D/g, '');
  if (n.startsWith('254')) return n;
  if (n.startsWith('0'))   return '254' + n.slice(1);
  if (n.startsWith('7') || n.startsWith('1')) return '254' + n;
  return n;
}

/* POST /api/mpesa/stkpush */
router.post('/stkpush', async (req, res) => {
  try {
    const { phone, amount, orderId, email, firstName } = req.body || {};
    if (!phone || !amount) return res.status(400).json({ success: false, error: 'Phone and amount required.' });
    if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY) {
      // No credentials — return mock success so frontend flow works in demo
      const mockId = 'MOCK-' + Date.now();
      payments[mockId] = { status: 'paid', orderId };
      return res.json({ success: true, data: { checkoutRequestId: mockId, message: 'Demo STK push sent.' } });
    }

    const token = await getAccessToken();
    const ts    = timestamp();
    const body  = {
      BusinessShortCode: SHORTCODE,
      Password:          password(ts),
      Timestamp:         ts,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            Math.ceil(amount),
      PartyA:            formatPhone(phone),
      PartyB:            SHORTCODE,
      PhoneNumber:       formatPhone(phone),
      CallBackURL:       CALLBACK_URL,
      AccountReference:  orderId || 'LUMEVA',
      TransactionDesc:   `LUMEVA order ${orderId || ''}`,
    };

    const stkRes  = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const stkData = await stkRes.json();

    if (stkData.ResponseCode === '0') {
      payments[stkData.CheckoutRequestID] = { status: 'pending', orderId };
      res.json({ success: true, data: { checkoutRequestId: stkData.CheckoutRequestID, message: 'STK push sent.' } });
    } else {
      res.status(400).json({ success: false, error: stkData.errorMessage || 'STK push failed.' });
    }
  } catch (err) {
    console.error('STK push error:', err.message);
    res.status(500).json({ success: false, error: 'M-Pesa request failed.' });
  }
});

/* POST /api/mpesa/callback — Daraja calls this after payment */
router.post('/callback', (req, res) => {
  try {
    const body = req.body?.Body?.stkCallback;
    if (!body) return res.sendStatus(200);

    const { CheckoutRequestID, ResultCode } = body;
    if (payments[CheckoutRequestID]) {
      payments[CheckoutRequestID].status = ResultCode === 0 ? 'paid' : 'failed';
    }
    console.log(`M-Pesa callback: ${CheckoutRequestID} → ${ResultCode === 0 ? 'paid' : 'failed'}`);
  } catch (err) {
    console.error('callback error', err);
  }
  res.sendStatus(200);
});

/* GET /api/mpesa/status/:checkoutRequestId */
router.get('/status/:id', (req, res) => {
  const record = payments[req.params.id];
  if (!record) return res.json({ success: true, data: { status: 'pending' } });
  res.json({ success: true, data: record });
});

module.exports = router;
