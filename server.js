/**
 * AuraMed+ Modern Digital Pharmacy & Healthcare Hub
 * Primary Application & Backend Server (Node.js & Express)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize database
const db = require('./backend/db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AuraMed+ Digital Pharmacy API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: 'connected (file-backed persistent JSON)'
  });
});

// Mount API Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/products', require('./backend/routes/products'));
app.use('/api/prescriptions', require('./backend/routes/prescriptions'));
app.use('/api/orders', require('./backend/routes/orders'));
app.use('/api/consultations', require('./backend/routes/consultations'));
app.use('/api/admin', require('./backend/routes/admin'));

// Fallback route for SPA or root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Admin panel direct route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint '${req.originalUrl}' not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` AuraMed+ Pharmacy & Healthcare Server is Running!`);
  console.log(` Storefront: http://localhost:${PORT}/`);
  console.log(` Admin Portal: http://localhost:${PORT}/admin`);
  console.log(` API Health: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
