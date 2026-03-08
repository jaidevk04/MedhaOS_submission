const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { callGemini } = require('../config/gemini');
const logger = require('../config/logger');

// Triage questions
const TRIAGE_QUESTIONS = [
  { id: 1, question: 'What is your main complaint?', type: 'text', required: true },
  { id: 2, question: 'When did symptoms start?', type: 'select', options: ['<1 hour', '1-6 hours', '6-24 hours', '1-7 days', '>7 days'], required: true },
  { id: 3, question: 'Pain level (0-10)?', type: 'number', min: 0, max: 10, required: false },
  { id: 4, question: 'Select symptoms', type: 'multiselect', options: ['Fever', 'Cough', 'Shortness of breath', 'Chest pain', 'Nausea', 'Vomiting', 'Dizziness', 'Headache'], required: true }
];

// Get triage questions
router.get('/questions', (req, res) => {
  res.json({ questions: TRIAGE_QUESTIONS });
});

// Calculate urgency score with AI
router.post('/score', async (req, res) => {
  try {
    const { patient_id, symptoms, vitals, chief_complaint, answers, session_type = 'text', language = 'en' } = req.body;
    
    const startTime = Date.now();
    
    // Use Gemini AI to analyze symptoms
    const messages = [
      {
        role: 'system',
        content: 'You are a medical triage AI. Analyze symptoms and provide urgency score (0-100) and recommended specialty. Respond in JSON format: {"urgency_score": number, "specialty": string, "reasoning": string}'
      },
      {
        role: 'user',
        content: `Patient symptoms: ${JSON.stringify(symptoms)}. Chief complaint: ${chief_complaint}. Vitals: ${JSON.stringify(vitals)}. Provide urgency assessment.`
      }
    ];
    
    const aiResponse = await callGemini(messages, { temperature: 0.3 });
    
    let urgencyScore = 50;
    let specialty = 'General Medicine';
    let reasoning = 'Standard assessment';
    
    if (aiResponse.success) {
      try {
        const parsed = JSON.parse(aiResponse.content);
        urgencyScore = parsed.urgency_score || 50;
        specialty = parsed.specialty || 'General Medicine';
        reasoning = parsed.reasoning || 'AI assessment';
      } catch (e) {
        // Fallback to rule-based
        urgencyScore = calculateRuleBasedScore(symptoms, vitals);
        specialty = determineSpecialty(symptoms);
      }
    } else {
      urgencyScore = calculateRuleBasedScore(symptoms, vitals);
      specialty = determineSpecialty(symptoms);
    }
    
    const encounterType = urgencyScore >= 70 ? 'ED' : 'OPD';
    const executionTime = Date.now() - startTime;
    const recommendedAction = urgencyScore >= 70 ? 'emergency' : urgencyScore >= 40 ? 'urgent_care' : 'schedule_appointment';
    
    // Save triage session
    let sessionId = null;
    if (patient_id) {
      const sessionResult = await pool.query(
        `INSERT INTO triage_sessions (patient_id, session_type, language, symptoms, conversation_data, triage_result, urgency_score, recommended_action, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING session_id`,
        [
          patient_id,
          session_type,
          language,
          symptoms,
          JSON.stringify({ answers, vitals, chief_complaint }),
          JSON.stringify({ urgencyScore, specialty, reasoning, encounterType }),
          urgencyScore,
          recommendedAction
        ]
      );
      sessionId = sessionResult.rows[0].session_id;
    }
    
    // Log agent task
    await pool.query(
      `INSERT INTO agent_tasks (agent_name, task_type, related_entity_type, related_entity_id, input_data, output_data, confidence_score, execution_time_ms, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['AI_Triage_Agent', 'urgency_scoring', 'patient', patient_id, JSON.stringify({ symptoms, vitals }), JSON.stringify({ urgencyScore, specialty }), urgencyScore / 100, executionTime, 'completed']
    );
    
    logger.info(`Triage completed: Score ${urgencyScore}, Specialty: ${specialty}, Session: ${sessionId}`);
    
    res.json({
      success: true,
      session_id: sessionId,
      urgency_score: urgencyScore,
      specialty,
      encounter_type: encounterType,
      reasoning,
      recommendation: getRecommendation(urgencyScore),
      execution_time_ms: executionTime
    });
  } catch (error) {
    logger.error('Triage error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function calculateRuleBasedScore(symptoms, vitals) {
  let score = 0;
  const criticalSymptoms = ['Chest pain', 'Shortness of breath', 'Severe bleeding'];
  if (symptoms?.some(s => criticalSymptoms.includes(s))) score += 40;
  else score += symptoms?.length * 5 || 10;
  
  if (vitals?.temperature > 38.5) score += 10;
  if (vitals?.heart_rate > 100) score += 10;
  if (vitals?.spo2 < 95) score += 20;
  
  return Math.min(score, 100);
}

function determineSpecialty(symptoms) {
  if (symptoms?.includes('Chest pain')) return 'Cardiology';
  if (symptoms?.includes('Shortness of breath')) return 'Pulmonology';
  if (symptoms?.includes('Headache')) return 'Neurology';
  return 'General Medicine';
}

function getRecommendation(score) {
  if (score >= 70) return 'Immediate Emergency Department admission recommended';
  if (score >= 40) return 'OPD appointment recommended within 24 hours';
  return 'Routine OPD appointment can be scheduled';
}

module.exports = router;
