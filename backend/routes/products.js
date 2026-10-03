const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/products - List all products with optional filters
router.get('/', (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const products = db.getProducts({ category, search, sort });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching products', error: err.message });
  }
});

// GET /api/products/:id - Single product details
router.get('/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/products - Add new product (Admin)
router.post('/', (req, res) => {
  try {
    const { name, genericName, brand, category, categoryLabel, dosage, price, requiresRx, stockQuantity, description, activeIngredients, usageAdvice, sideEffects } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: 'Medicine name, price, and category are required' });
    }

    const newProduct = db.createProduct({
      name,
      genericName: genericName || name,
      brand: brand || 'Generic Pharma',
      category,
      categoryLabel: categoryLabel || category,
      dosage: dosage || 'Standard Unit',
      price: parseFloat(price),
      originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : null,
      rating: 5.0,
      reviewsCount: 1,
      requiresRx: !!requiresRx,
      inStock: true,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 50,
      badge: req.body.badge || (requiresRx ? 'Rx Required' : 'OTC Health'),
      description: description || 'Certified pharmaceutical formulation.',
      activeIngredients: activeIngredients || 'Standard active formulation.',
      usageAdvice: usageAdvice || 'As directed by your physician.',
      sideEffects: sideEffects || 'Consult product monograph.',
      temperatureControl: req.body.temperatureControl || 'Store below 25°C',
      imageType: req.body.imageType || 'pill'
    });

    res.status(201).json({ success: true, message: 'Product added successfully', data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create product', error: err.message });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', (req, res) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product', error: err.message });
  }
});

// DELETE /api/products/:id - Remove product
router.delete('/:id', (req, res) => {
  try {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete product', error: err.message });
  }
});

module.exports = router;
