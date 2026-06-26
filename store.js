'use strict';

// Simple in-memory store — replace with a real DB when ready
// Data resets on Render redeploy, but works perfectly for MVP

const store = {
  users:  [],   // { id, name, email, passwordHash, createdAt }
  orders: [],   // { orderId, email, items, total, status, createdAt, ... }
};

module.exports = store;
