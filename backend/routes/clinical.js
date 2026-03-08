const express = require('express');
const router = express.Router();
const multer = require('multer');
const { callGemini } = require('../config/gemini');
const { transcribeAudio, analyzeSymptoms } = require('../services/gemini-voice');
const { pool } = require('../config/database');
const { authenticateToken } = require('./auth');
const logger = require('../config/logger');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Transcribe audio
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    logger.info('Transcribing audio', { size: req.file.size, mimeType: req.file.mimetype });
    
    const result = await transcribeAudio(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (error) {
    logger.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
});

// Generate SOAP notes
router.post('/scribe/generate-soap', async (req, res) => {
  try {
    const { transcript, patient_context } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are an expert medical scribe. Generate a professional SOAP note based on the consultation transcript.

IMPORTANT: You MUST fill in ALL sections of the SOAP note. Do not leave any section empty.

Output JSON format:
{
  "soap": {
    "subjective": "Patient's complaints, history, symptoms. Include chief complaint, duration, characteristics, associated symptoms, relevant medical history.",
    "objective": "Vital signs if mentioned, physical examination findings, observations. If vitals not mentioned, state 'Vital signs: To be recorded' or describe general appearance.",
    "assessment": "Primary diagnosis and differential diagnoses with clinical reasoning. Always provide at least one diagnosis based on the symptoms.",
    "plan": "Treatment plan including medications with dosage, diagnostic tests, follow-up instructions, patient education.",
    "clinical_summary": "A brief 2-3 sentence summary of the encounter."
  },
  "structured_data": {
    "prescriptions": [
      {
        "drug_name": "Name of drug",
        "dosage": "e.g., 500mg",
        "frequency": "e.g., twice daily",
        "duration": "e.g., 5 days",
        "instructions": "e.g., take after food"
      }
    ],
    "diagnostics": [
      {
        "test_name": "Name of test (e.g., CBC, X-Ray Chest)",
        "reason": "Reason for testing"
      }
    ]
  }
}

Example:
If transcript says "Patient has headache for 3 days, throbbing pain, worse with light. BP 130/85. Prescribe Sumatriptan."

You should generate:
{
  "soap": {
    "subjective": "Patient reports severe headache for 3 days. Pain is described as throbbing in nature and worsens with exposure to bright lights (photophobia).",
    "objective": "Blood pressure: 130/85 mmHg. Patient appears uncomfortable but alert and oriented.",
    "assessment": "Migraine headache with photophobia. Differential diagnosis includes tension headache and cluster headache.",
    "plan": "1. Sumatriptan as prescribed for acute migraine relief. 2. Advise rest in dark, quiet environment. 3. Follow-up if symptoms persist or worsen. 4. Consider preventive therapy if frequency increases.",
    "clinical_summary": "Patient with 3-day history of throbbing headache with photophobia, consistent with migraine. Prescribed Sumatriptan for acute relief."
  }
}`
      },
      {
        role: 'user',
        content: `Generate a complete SOAP note for this consultation.

Transcript: "${transcript}"

Patient Context: ${JSON.stringify(patient_context || {})}

Remember: Fill in ALL sections (Subjective, Objective, Assessment, Plan) with relevant clinical information. Do not leave any section empty.`
      }
    ];
    
    const response = await callGemini(messages, { 
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    if (response.success) {
      try {
        let jsonText = response.content.trim();
        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\n?/g, '');
        }
        
        let parsed = JSON.parse(jsonText);
        // Handle both old and new format fallback
        const soap = parsed.soap || parsed; 
        const structured = parsed.structured_data || { prescriptions: [], diagnostics: [] };

        res.json({ success: true, soap, structured });
      } catch (e) {
        // Fallback if JSON parsing fails
        logger.error('Failed to parse SOAP JSON', e);
        res.json({ 
          success: true, 
          soap: { 
            subjective: transcript, 
            objective: 'See transcript', 
            assessment: 'Parsing error', 
            plan: 'Review transcript manually',
            clinical_summary: 'Auto-generation failed to parse.'
          },
          structured: { prescriptions: [], diagnostics: [] }
        });
      }
    } else {
      res.status(500).json({ error: 'AI generation failed' });
    }
  } catch (error) {
    logger.error('SOAP generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start consultation from appointment (Moved here due to routing issues)
router.post('/start-consultation', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { appointment_id } = req.body;
    const clinicianId = req.user.id;

    if (!appointment_id) {
      return res.status(400).json({ error: 'Appointment ID required' });
    }

    await client.query('BEGIN');

    // 1. Get Appointment Details
    const apptResult = await client.query(`
      SELECT a.*, p.first_name, p.last_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.appointment_id = $1
    `, [appointment_id]);

    if (apptResult.rows.length === 0) {
      throw new Error('Appointment not found');
    }

    const appt = apptResult.rows[0];

    // 2. Check if encounter already exists
    const encounterCheck = await client.query(`
      SELECT encounter_id FROM clinical_encounters 
      WHERE patient_id = $1 
      AND clinician_id = $2 
      AND created_at::date = CURRENT_DATE
      AND status = 'in_progress'
    `, [appt.patient_id, clinicianId]);

    let encounterId;

    if (encounterCheck.rows.length > 0) {
      encounterId = encounterCheck.rows[0].encounter_id;
    } else {
      // 3. Create new encounter
      const triageRes = await client.query(`
        SELECT * FROM triage_sessions 
        WHERE patient_id = $1 
        ORDER BY completed_at DESC LIMIT 1
      `, [appt.patient_id]);

      let triageData = {};
      let urgencyScore = appt.urgency_score || 0;
      let symptoms = [];

      if (triageRes.rows.length > 0) {
        const triage = triageRes.rows[0];
        triageData = triage.triage_result || {};
        urgencyScore = triage.urgency_score || urgencyScore;
        symptoms = triage.symptoms || [];
      }

      const insertRes = await client.query(`
        INSERT INTO clinical_encounters (
          patient_id, facility_id, clinician_id, encounter_type,
          urgency_score, chief_complaint, symptoms, triage_data,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'in_progress', NOW())
        RETURNING encounter_id
      `, [
        appt.patient_id,
        appt.facility_id,
        clinicianId, 
        'OPD',
        urgencyScore,
        appt.notes || 'Scheduled Consultation', 
        symptoms,
        triageData
      ]);
      
      encounterId = insertRes.rows[0].encounter_id;

      // 4. Update Appointment Status
      await client.query(`
        UPDATE appointments 
        SET status = 'in-progress', actual_start_time = NOW() 
        WHERE appointment_id = $1
      `, [appointment_id]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      encounterId: encounterId
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Start consultation error:', error);
    res.status(500).json({ error: 'Failed to start consultation: ' + error.message });
  } finally {
    client.release();
  }
});

// CDSS Analysis
router.post('/cdss/analyze', async (req, res) => {
  try {
    const { transcript, soap_note, patient_context } = req.body;
    
    const messages = [
      {
        role: 'system',
        content: `You are a Clinical Decision Support System (CDSS) AI. Analyze the consultation data and provide evidence-based recommendations.
        
        Output JSON format:
        {
          "differentials": ["Condition 1 (Probability%)", "Condition 2 (Probability%)"],
          "red_flags": ["Critical symptom or risk factor identified"],
          "recommended_tests": ["Lab Test 1", "Imaging 1"],
          "treatment_suggestions": ["Medication class or specific drug", "Lifestyle advice"],
          "risk_score": 0-100
        }`
      },
      {
        role: 'user',
        content: `Consultation Data:
        Transcript Summary: ${transcript ? transcript.substring(0, 500) + '...' : 'N/A'}
        SOAP Note: ${JSON.stringify(soap_note || {})}
        Patient Context: ${JSON.stringify(patient_context || {})}`
      }
    ];
    
    const response = await callGemini(messages, { 
      temperature: 0.2,
      response_format: { type: "json_object" }
    });
    
    if (response.success) {
      try {
        const analysis = JSON.parse(response.content);
        res.json({ success: true, analysis });
      } catch (e) {
        res.json({ success: false, error: 'Failed to parse CDSS response' });
      }
    } else {
      res.status(500).json({ error: 'CDSS analysis failed' });
    }
  } catch (error) {
    logger.error('CDSS analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save Encounter
router.post('/encounters/:encounterId/finalize', async (req, res) => {
  const client = await pool.connect();
  try {
    const { encounterId } = req.params;
    const { soap_note, prescriptions, diagnostics, follow_up } = req.body;
    
    await client.query('BEGIN');
    
    // 1. Update Clinical Encounter
    await client.query(`
      UPDATE clinical_encounters 
      SET 
        status = 'completed',
        clinical_notes = $1,
        diagnoses = $2,
        prescriptions = $3,
        updated_at = NOW(),
        discharge_date = NOW()
      WHERE encounter_id = $4
    `, [
      JSON.stringify(soap_note), 
      JSON.stringify({ assessment: soap_note.assessment }), 
      JSON.stringify(prescriptions || []), 
      encounterId
    ]);

    // 2. Add Prescriptions to current_medications (for patient record)
    if (prescriptions && prescriptions.length > 0) {
      // Fetch patient_id from encounter
      const encounterRes = await client.query('SELECT patient_id, clinician_id FROM clinical_encounters WHERE encounter_id = $1', [encounterId]);
      if (encounterRes.rows.length > 0) {
        const { patient_id, clinician_id } = encounterRes.rows[0];
        
        for (const rx of prescriptions) {
          await client.query(`
            INSERT INTO current_medications (
              patient_id, drug_name, dosage, frequency, route, 
              start_date, end_date, prescribing_doctor_id, is_active
            ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, TRUE)
          `, [
            patient_id, 
            rx.drug_name, 
            rx.dosage, 
            rx.frequency, 
            rx.route || 'oral', 
            rx.duration ? new Date(Date.now() + parseInt(rx.duration) * 24 * 60 * 60 * 1000) : null,
            clinician_id
          ]);
        }
      }
    }

    // 3. Add Diagnostics
    if (diagnostics && diagnostics.length > 0) {
       const encounterRes = await client.query('SELECT patient_id, clinician_id FROM clinical_encounters WHERE encounter_id = $1', [encounterId]);
       if (encounterRes.rows.length > 0) {
         const { patient_id, clinician_id } = encounterRes.rows[0];
         
         for (const dx of diagnostics) {
           await client.query(`
             INSERT INTO diagnostic_reports (
               patient_id, encounter_id, test_name, report_type, status, ordered_at
             ) VALUES ($1, $2, $3, 'laboratory', 'pending', NOW())
           `, [patient_id, encounterId, dx.test_name]);
         }
       }
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Encounter finalized successfully' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Finalize encounter error:', error);
    res.status(500).json({ error: 'Failed to finalize encounter: ' + error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
