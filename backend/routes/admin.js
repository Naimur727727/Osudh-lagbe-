const express = require('express');
const router = express.Router();
const db = require('../db/database');

// POST /api/admin/login - Authenticate dispensary admin
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const authResult = db.authenticateAdmin(email, password);
    if (!authResult.success) {
      return res.status(401).json({ success: false, message: authResult.message });
    }

    res.json({
      success: true,
      message: 'Authentication successful. Access granted.',
      data: authResult.user
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login error', error: err.message });
  }
});

// GET /api/admin/verify - Verify session token
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace('Bearer ', '') : req.query.token;

    const isValid = db.verifyAdminToken(token);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token' });
    }

    const admin = db.getAdmin();
    res.json({
      success: true,
      data: {
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification error', error: err.message });
  }
});

// POST /api/admin/change-password - Update admin credentials
router.post('/change-password', (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both old and new passwords are required' });
    }

    const result = db.changeAdminPassword(oldPassword, newPassword);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Password change error', error: err.message });
  }
});

// GET /api/admin/settings - Get store settings
router.get('/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT /api/admin/settings - Update store settings
router.put('/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, message: 'Store settings updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/admin/stats - Overview metrics for shop owner
router.get('/stats', (req, res) => {
  try {
    const stats = db.getAdminStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/admin/db-export - Complete database snapshot
router.get('/db-export', (req, res) => {
  try {
    const data = db.read();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
