/**
 * AuraMed+ Customer Authentication & Account Management Routes
 */

const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Helper to extract token from Authorization header or query
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.query.token || null;
}

// POST /api/auth/register - Create customer account
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: 'Name, password, and at least an email or phone number are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const result = db.registerUser({ name, email, phone, password, address });
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration error', error: err.message });
  }
});

// POST /api/auth/login - Customer Sign In
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone and password are required'
      });
    }

    const result = db.authenticateUser(identifier, password);
    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login error', error: err.message });
  }
});

// GET /api/auth/me - Get current logged in customer
router.get('/me', (req, res) => {
  try {
    const token = extractToken(req);
    const user = db.getUserByToken(token);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated or invalid session' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/auth/my-orders - Get past orders for logged in user
router.get('/my-orders', (req, res) => {
  try {
    const token = extractToken(req);
    const user = db.getUserByToken(token);

    let identifier = req.query.phone || req.query.email;
    if (user) {
      identifier = user.phone || user.email || user.name;
    }

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Phone or email required to retrieve orders' });
    }

    const orders = db.getUserOrders(identifier);
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/auth/my-prescriptions - Get prescriptions uploaded by user
router.get('/my-prescriptions', (req, res) => {
  try {
    const token = extractToken(req);
    const user = db.getUserByToken(token);

    let identifier = req.query.phone || req.query.email;
    if (user) {
      identifier = user.phone || user.email || user.name;
    }

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Phone or email required' });
    }

    const prescriptions = db.getUserPrescriptions(identifier);
    res.json({ success: true, count: prescriptions.length, prescriptions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
