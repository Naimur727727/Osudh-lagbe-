const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Clinical response logic for Pharmacist
function generatePharmacistReply(userText) {
  const text = userText.toLowerCase();

  if (text.includes('headache') || text.includes('pain') || text.includes('fever')) {
    return "For mild headache or fever, Paracetamol 500mg (1-2 tablets every 4 to 6 hours, max 4000mg/day) is our standard first recommendation. If you have inflammation or joint pain, Ibuprofen 400mg taken with meals works well. Do you have any prior stomach ulcer conditions?";
  }
  if (text.includes('prescription') || text.includes('rx') || text.includes('upload')) {
    return "You can upload your prescription directly using the 'Upload Rx' button on our site! Once uploaded, our clinical team verifies dosage accuracy and prepares your cold-chain shipment within 15 minutes.";
  }
  if (text.includes('delivery') || text.includes('shipping') || text.includes('time')) {
    return "We offer 30-minute Express Rapid Delivery across the metropolitan area! All temperature-sensitive medications are transported in certified cold-chain insulated bags.";
  }
  if (text.includes('antibiotic') || text.includes('amoxicillin') || text.includes('infection')) {
    return "Antibiotics such as AmoxiClav strictly require a verified doctor's prescription to prevent bacterial resistance. Always complete the full prescribed course even if symptoms subside early.";
  }
  if (text.includes('blood pressure') || text.includes('bp') || text.includes('hypertension')) {
    return "For blood pressure management, maintain a low sodium diet and take medications like Atorvastatin or ACE inhibitors at the same hour daily. You can also order an Omron upper-arm BP monitor from our devices section.";
  }
  if (text.includes('hello') || text.includes('hi') || text.includes('help')) {
    return "Hello! I'm Dr. Elena Rostova, Lead Clinical Pharmacist at AuraMed+. How can I assist you with your medications, dosage questions, or prescription refills today?";
  }

  return "Thank you for reaching out. Based on your inquiry, our licensed clinical pharmacist has received your note. For urgent symptoms, you can also call our 24/7 direct hotline at (800) 555-AURA for immediate assistance!";
}

// POST /api/consultations/message - Send message & receive clinical response
router.post('/message', (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const sid = sessionId || 'session_' + Date.now();

    // Save user message
    db.saveConsultationMessage(sid, {
      sender: 'user',
      text: message.trim()
    });

    // Generate clinical reply
    const replyText = generatePharmacistReply(message);

    // Save bot reply
    db.saveConsultationMessage(sid, {
      sender: 'pharmacist',
      pharmacistName: 'Dr. Elena Rostova, PharmD',
      text: replyText
    });

    res.json({
      success: true,
      sessionId: sid,
      reply: {
        sender: 'pharmacist',
        pharmacistName: 'Dr. Elena Rostova, PharmD',
        text: replyText,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error processing consultation', error: err.message });
  }
});

// GET /api/consultations/:sessionId - Get chat history
router.get('/:sessionId', (req, res) => {
  try {
    const history = db.getConsultationHistory(req.params.sessionId);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
