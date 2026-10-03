const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const db = require('../db/database');

// POST /api/prescriptions/upload - Upload new prescription
router.post('/upload', upload.single('prescriptionFile'), (req, res) => {
  try {
    const { patientName, patientPhone, patientNotes } = req.body;

    if (!patientName || !patientPhone) {
      return res.status(400).json({ success: false, message: 'Patient name and phone number are required' });
    }

    let fileName = 'manual_entry.pdf';
    let filePath = '';
    let fileUrl = '';

    if (req.file) {
      fileName = req.file.originalname;
      filePath = req.file.path;
      fileUrl = `/uploads/prescriptions/${req.file.filename}`;
    }

    const prescription = db.createPrescription({
      patientName,
      patientPhone,
      patientNotes: patientNotes || '',
      fileName,
      filePath,
      fileUrl
    });

    res.status(201).json({
      success: true,
      message: 'Prescription uploaded and submitted to clinical pharmacist for verification.',
      data: prescription
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error processing prescription upload', error: err.message });
  }
});

// GET /api/prescriptions - List all prescriptions (Admin/Pharmacist)
router.get('/', (req, res) => {
  try {
    const list = db.getPrescriptions();
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/prescriptions/:id
router.get('/:id', (req, res) => {
  try {
    const rx = db.getPrescriptionById(req.params.id);
    if (!rx) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    res.json({ success: true, data: rx });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PATCH /api/prescriptions/:id/status - Approve or reject Rx
router.patch('/:id/status', (req, res) => {
  try {
    const { status, pharmacistNotes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updated = db.updatePrescriptionStatus(req.params.id, status, pharmacistNotes);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({ success: true, message: `Prescription status updated to ${status}`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update prescription', error: err.message });
  }
});

module.exports = router;
