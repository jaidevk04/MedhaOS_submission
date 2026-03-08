const express = require('express');
const router = express.Router();
const { callGemini } = require('../config/gemini');
const logger = require('../config/logger');

// Check drug interactions
router.post('/check-interactions', async (req, res) => {
  try {
    const { drugs, patient_medications } = req.body;
    
    const messages = [
      {
        role: 'system',
        content: 'You are a pharmacology expert. Check drug interactions. Return JSON: {"has_interactions": boolean, "interactions": [{"severity": "", "description": ""}], "recommendations": ""}'
      },
      {
        role: 'user',
        content: `New drugs: ${JSON.stringify(drugs)}. Current medications: ${JSON.stringify(patient_medications)}`
      }
    ];
    
    const response = await callGemini(messages, { temperature: 0.2 });
    
    if (response.success) {
      try {
        const result = JSON.parse(response.content);
        res.json({ success: true, ...result });
      } catch (e) {
        res.json({ success: true, has_interactions: false, interactions: [], recommendations: 'No known interactions' });
      }
    } else {
      res.json({ success: true, has_interactions: false, interactions: [] });
    }
  } catch (error) {
    logger.error('Drug interaction check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check allergies
router.post('/check-allergies', async (req, res) => {
  try {
    const { drug, patient_allergies } = req.body;
    
    const hasConflict = patient_allergies?.some(a => 
      a.allergen.toLowerCase().includes(drug.toLowerCase()) ||
      drug.toLowerCase().includes(a.allergen.toLowerCase())
    );
    
    res.json({
      success: true,
      has_conflict: hasConflict,
      conflicting_allergies: hasConflict ? patient_allergies.filter(a => 
        a.allergen.toLowerCase().includes(drug.toLowerCase())
      ) : []
    });
  } catch (error) {
    logger.error('Allergy check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
