const express = require('express');
const router = express.Router();
const db = require('../db/database');

// POST /api/orders - Place a new order
router.post('/', (req, res) => {
  try {
    const { customerName, phone, address, items, speed, paymentMethod } = req.body;

    if (!customerName || !phone || !address || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, address, and at least one item are required'
      });
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.price) * parseInt(i.quantity)), 0);
    const deliveryFee = subtotal > 35 ? 0 : 4.99;
    const grandTotal = subtotal + deliveryFee;

    const order = db.createOrder({
      customerName,
      phone,
      address,
      speed: speed || 'express',
      paymentMethod: paymentMethod || 'card',
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    });

    res.status(201).json({
      success: true,
      message: 'Prescription order confirmed and queued for dispensary packing.',
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to place order', error: err.message });
  }
});

// GET /api/orders - Get all orders (Store Manager)
router.get('/', (req, res) => {
  try {
    const orders = db.getOrders();
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/orders/:orderId - Order details & live tracking history
router.get('/:orderId', (req, res) => {
  try {
    const order = db.getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PATCH /api/orders/:orderId/status - Update order delivery status
router.patch('/:orderId/status', (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['confirmed', 'verified', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updated = db.updateOrderStatus(req.params.orderId, status, note);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: `Order status updated to ${status}`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order status', error: err.message });
  }
});

module.exports = router;
