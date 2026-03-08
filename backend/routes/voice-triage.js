const express = require('express');
const router = express.Router();
const multer = require('multer');
const { pool } = require('../config/database');
const { 
  transcribeAudio, 
  conductTriageConversation, 
  generateVoiceResponse,
  analyzeSymptoms 
} = require('../services/gemini-voice');
const logger = require('../config/logger');

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Transcribe audio to text with language detection
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const { patient_id } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    
    const startTime = Date.now();
    
    // Transcribe audio using Gemini
    const transcription = await transcribeAudio(req.file.buffer, req.file.mimetype);
    
    const executionTime = Date.now() - startTime;
    
    // Log the transcription task
    if (patient_id) {
      await pool.query(
        `INSERT INTO agent_tasks (agent_name, task_type, related_entity_type, related_entity_id, 
                                  input_data, output_data, confidence_score, execution_time_ms, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'Voice_Transcription_Agent',
          'audio_transcription',
          'patient',
          patient_id,
          JSON.stringify({ audio_size: req.file.size, mime_type: req.file.mimetype }),
          JSON.stringify(transcription),
          transcription.confidence || 0.8,
          executionTime,
          'completed'
        ]
      );
    }
    
    logger.info('Audio transcribed successfully', {
      patient_id,
      language: transcription.language,
      emotion: transcription.emotion,
      execution_time: executionTime
    });
    
    res.json({
      success: true,
      ...transcription,
      execution_time_ms: executionTime
    });
    
  } catch (error) {
    logger.error('Audio transcription error:', error);
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      message: error.message 
    });
  }
});

// Conduct AI triage conversation
router.post('/triage-conversation', async (req, res) => {
  try {
    const { patient_id, transcript, conversation_history = [], language = 'en' } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    
    const startTime = Date.now();
    
    // Get patient history if patient_id provided
    let patientHistory = {};
    if (patient_id) {
      const historyResult = await pool.query(
        `SELECT p.*, 
                (SELECT json_agg(mh.*) FROM medical_history mh WHERE mh.patient_id = p.patient_id) as medical_history,
                (SELECT json_agg(a.*) FROM allergies a WHERE a.patient_id = p.patient_id) as allergies,
                (SELECT json_agg(cm.*) FROM current_medications cm WHERE cm.patient_id = p.patient_id AND cm.is_active = true) as medications
         FROM patients p WHERE p.patient_id = $1`,
        [patient_id]
      );
      
      if (historyResult.rows.length > 0) {
        patientHistory = historyResult.rows[0];
      }
    }
    
    // Conduct triage conversation with Gemini
    const triageResponse = await conductTriageConversation(
      transcript, 
      patientHistory, 
      conversation_history,
      language
    );
    
    const executionTime = Date.now() - startTime;
    
    // Create or update clinical encounter
    let encounterId = null;
    if (patient_id) {
      // Check if there's an ongoing encounter
      const existingEncounter = await pool.query(
        `SELECT encounter_id FROM clinical_encounters 
         WHERE patient_id = $1 AND status = 'in_progress' 
         ORDER BY created_at DESC LIMIT 1`,
        [patient_id]
      );
      
      if (existingEncounter.rows.length > 0) {
        encounterId = existingEncounter.rows[0].encounter_id;
        
        // Update existing encounter
        await pool.query(
          `UPDATE clinical_encounters 
           SET urgency_score = $1, symptoms = $2, triage_data = $3, updated_at = CURRENT_TIMESTAMP
           WHERE encounter_id = $4`,
          [
            triageResponse.urgency_score,
            triageResponse.symptoms_identified,
            JSON.stringify({
              conversation_history: [...conversation_history, {
                timestamp: new Date().toISOString(),
                patient_input: transcript,
                ai_response: triageResponse
              }],
              recommended_specialty: triageResponse.recommended_specialty,
              recommended_action: triageResponse.recommended_action
            }),
            encounterId
          ]
        );
      } else {
        // Create new encounter
        const newEncounter = await pool.query(
          `INSERT INTO clinical_encounters (patient_id, encounter_type, urgency_score, 
                                           chief_complaint, symptoms, triage_data, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING encounter_id`,
          [
            patient_id,
            triageResponse.recommended_action === 'ED' ? 'ED' : 'OPD',
            triageResponse.urgency_score,
            transcript,
            triageResponse.symptoms_identified,
            JSON.stringify({
              conversation_history: [{
                timestamp: new Date().toISOString(),
                patient_input: transcript,
                ai_response: triageResponse
              }],
              recommended_specialty: triageResponse.recommended_specialty,
              recommended_action: triageResponse.recommended_action
            }),
            'in_progress'
          ]
        );
        
        encounterId = newEncounter.rows[0].encounter_id;
      }
      
      // Log the triage task
      await pool.query(
        `INSERT INTO agent_tasks (agent_name, task_type, related_entity_type, related_entity_id,
                                  input_data, output_data, confidence_score, execution_time_ms, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'AI_Triage_Agent',
          'triage_conversation',
          'encounter',
          encounterId,
          JSON.stringify({ transcript, conversation_history }),
          JSON.stringify(triageResponse),
          triageResponse.urgency_score / 100,
          executionTime,
          'completed'
        ]
      );
    }
    
    logger.info('Triage conversation completed', {
      patient_id,
      encounter_id: encounterId,
      urgency_score: triageResponse.urgency_score,
      specialty: triageResponse.recommended_specialty,
      execution_time: executionTime
    });
    
    res.json({
      success: true,
      encounter_id: encounterId,
      ...triageResponse,
      execution_time_ms: executionTime
    });
    
  } catch (error) {
    logger.error('Triage conversation error:', error);
    res.status(500).json({ 
      error: 'Failed to conduct triage conversation',
      message: error.message 
    });
  }
});

// Generate voice response (TTS)
router.post('/generate-voice', async (req, res) => {
  try {
    const { text, language = 'en', voice = 'Aoede' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const voiceResponse = await generateVoiceResponse(text, language, voice);
    
    if (voiceResponse.audio_available) {
      // Send audio file
      res.set({
        'Content-Type': voiceResponse.mimeType,
        'Content-Length': voiceResponse.audio.length
      });
      res.send(voiceResponse.audio);
    } else {
      // Send text fallback
      res.json({
        success: true,
        ...voiceResponse
      });
    }
    
  } catch (error) {
    logger.error('Voice generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate voice response',
      message: error.message 
    });
  }
});

// Analyze symptoms comprehensively
router.post('/analyze-symptoms', async (req, res) => {
  try {
    const { patient_id, symptoms, additional_info = {} } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({ error: 'Symptoms array is required' });
    }
    
    const startTime = Date.now();
    
    // Get patient history if provided
    let patientHistory = {};
    if (patient_id) {
      const historyResult = await pool.query(
        `SELECT p.*, 
                (SELECT json_agg(mh.*) FROM medical_history mh WHERE mh.patient_id = p.patient_id) as medical_history,
                (SELECT json_agg(a.*) FROM allergies a WHERE a.patient_id = p.patient_id) as allergies,
                (SELECT json_agg(cm.*) FROM current_medications cm WHERE cm.patient_id = p.patient_id AND cm.is_active = true) as medications
         FROM patients p WHERE p.patient_id = $1`,
        [patient_id]
      );
      
      if (historyResult.rows.length > 0) {
        patientHistory = historyResult.rows[0];
      }
    }
    
    // Analyze symptoms with Gemini
    const analysis = await analyzeSymptoms(symptoms, { ...patientHistory, ...additional_info });
    
    const executionTime = Date.now() - startTime;
    
    // Log the analysis task
    if (patient_id) {
      await pool.query(
        `INSERT INTO agent_tasks (agent_name, task_type, related_entity_type, related_entity_id,
                                  input_data, output_data, confidence_score, execution_time_ms, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'Symptom_Analysis_Agent',
          'symptom_analysis',
          'patient',
          patient_id,
          JSON.stringify({ symptoms, additional_info }),
          JSON.stringify(analysis),
          analysis.urgency_score / 100,
          executionTime,
          'completed'
        ]
      );
    }
    
    logger.info('Symptoms analyzed', {
      patient_id,
      symptoms_count: symptoms.length,
      urgency_score: analysis.urgency_score,
      execution_time: executionTime
    });
    
    res.json({
      success: true,
      ...analysis,
      execution_time_ms: executionTime
    });
    
  } catch (error) {
    logger.error('Symptom analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze symptoms',
      message: error.message 
    });
  }
});

// Get triage history for a patient
router.get('/history/:patient_id', async (req, res) => {
  try {
    const { patient_id } = req.params;
    
    const result = await pool.query(
      `SELECT ce.*, 
              (SELECT json_agg(at.*) FROM agent_tasks at 
               WHERE at.related_entity_id = ce.encounter_id 
               AND at.related_entity_type = 'encounter'
               ORDER BY at.created_at) as agent_tasks
       FROM clinical_encounters ce
       WHERE ce.patient_id = $1
       ORDER BY ce.created_at DESC
       LIMIT 10`,
      [patient_id]
    );
    
    res.json({
      success: true,
      encounters: result.rows
    });
    
  } catch (error) {
    logger.error('Get triage history error:', error);
    res.status(500).json({ 
      error: 'Failed to get triage history',
      message: error.message 
    });
  }
});

module.exports = router;
