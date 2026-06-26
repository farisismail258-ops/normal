'use strict';

const express = require('express');
const router  = express.Router();

const DELIVERY_ZONES = [
  { name: 'Nairobi CBD', zone: 'CBD Express', fee: 150 },
  { name: 'Westlands', zone: 'CBD Express', fee: 150 },
  { name: 'Parklands', zone: 'CBD Express', fee: 150 },
  { name: 'Upper Hill', zone: 'CBD Express', fee: 150 },
  { name: 'Hurlingham', zone: 'CBD Express', fee: 150 },
  { name: 'Ngara', zone: 'CBD Express', fee: 150 },
  { name: 'Milimani', zone: 'CBD Express', fee: 150 },
  { name: 'Hospital Hill', zone: 'CBD Express', fee: 150 },
  { name: 'Eastleigh', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Kilimani', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Kileleshwa', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Lavington', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Karen', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Runda', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Gigiri', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Muthaiga', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Ridgeways', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Spring Valley', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Loresho', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Riverside', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Adams Arcade', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Ngong Road', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Buru Buru', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Umoja', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Donholm', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Komarock', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Fedha', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Nairobi West', zone: 'Nairobi Metro', fee: 250 },
  { name: 'South B', zone: 'Nairobi Metro', fee: 250 },
  { name: 'South C', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Langata', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Madaraka', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Woodley', zone: 'Nairobi Metro', fee: 250 },
  { name: 'Embakasi', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Kasarani', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Thika Road', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Ruaka', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Kikuyu', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Rongai', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Syokimau', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Imara Daima', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Utawala', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Roysambu', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Zimmerman', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Githurai', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Kahawa', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Ruiru', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Juja', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Limuru', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Ngong', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Athi River', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Kitengela', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Mlolongo', zone: 'Greater Nairobi', fee: 350 },
  { name: 'Mombasa', zone: 'Major Towns', fee: 500 },
  { name: 'Nakuru', zone: 'Major Towns', fee: 500 },
  { name: 'Kisumu', zone: 'Major Towns', fee: 500 },
  { name: 'Eldoret', zone: 'Major Towns', fee: 500 },
  { name: 'Thika', zone: 'Major Towns', fee: 500 },
  { name: 'Nyeri', zone: 'Major Towns', fee: 500 },
  { name: 'Meru', zone: 'Major Towns', fee: 500 },
  { name: 'Machakos', zone: 'Major Towns', fee: 500 },
  { name: 'Naivasha', zone: 'Major Towns', fee: 500 },
  { name: 'Kisii', zone: 'Major Towns', fee: 500 },
  { name: 'Kakamega', zone: 'Major Towns', fee: 500 },
  { name: 'Garissa', zone: 'Countrywide', fee: 700 },
  { name: 'Mombasa', zone: 'Countrywide', fee: 700 },
  { name: 'Malindi', zone: 'Countrywide', fee: 700 },
  { name: 'Lamu', zone: 'Countrywide', fee: 700 },
  { name: 'Wajir', zone: 'Countrywide', fee: 700 },
  { name: 'Mandera', zone: 'Countrywide', fee: 700 },
  { name: 'Marsabit', zone: 'Countrywide', fee: 700 },
  { name: 'Lodwar', zone: 'Countrywide', fee: 700 },
  { name: 'Homa Bay', zone: 'Countrywide', fee: 700 },
  { name: 'Narok', zone: 'Countrywide', fee: 700 },
  { name: 'Kajiado', zone: 'Countrywide', fee: 700 },
];

router.get('/search', (req, res) => {
  const q     = (req.query.q || '').trim().toLowerCase();
  const limit = parseInt(req.query.limit) || 10;
  if (!q) return res.json({ success: true, data: [] });
  const matches = DELIVERY_ZONES.filter(z => z.name.toLowerCase().includes(q)).slice(0, limit);
  res.json({ success: true, data: matches });
});

router.get('/zones', (req, res) => {
  res.json({ success: true, data: DELIVERY_ZONES });
});

module.exports = router;
