const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { initializeLiveSession, processMessage, processAudioChunk } = require('../services/gemini-live');
const logger = require('../config/logger');

// Store active sessions
const activeSessions = new Map();

/**
 * Initialize a live voice session
 */
router.post('/session/start', async (req, res) => {
  try {
    const { patient_id, language = 'en' } = req.body;
    
    // Create session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize Gemini model
    const sessionObj = await initializeLiveSession(language);
    
    // Store session
    activeSessions.set(sessionId, {
      sessionObj,
      language,
      patient_id,
      conversationHistory: [],
      symptoms: [],
      startTime: Date.now(),
    });
    
    logger.info('Live voice session started', { sessionId, patient_id, language });
    
    res.json({
      success: true,
      sessionId,
      message: language === 'hi' 
        ? 'नमस्ते! मैं आपकी मदद के लिए यहाँ हूँ। अपने लक्षणों के बारे में बताएं।'
        : 'Hello! I\'m here to help you. Please tell me about your symptoms.',
    });
  } catch (error) {
    logger.error('Failed to start live session:', error);
    res.status(500).json({ 
      error: 'Failed to start session',
      message: error.message 
    });
  }
});

/**
 * Process audio chunk in live session
 */
router.post('/session/:sessionId/audio', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { audioData } = req.body;
    
    const sessionRecord = activeSessions.get(sessionId);
    if (!sessionRecord) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Process audio with Gemini
    const result = await processAudioChunk(
      sessionRecord.sessionObj,
      Buffer.from(audioData, 'base64')
    );
    
    // Update session history
    sessionRecord.conversationHistory.push({ role: 'user', content: '[Audio chunk]' });
    sessionRecord.conversationHistory.push({ role: 'ai', content: result.text });
    
    res.json({
      success: true,
      response: result.text,
      audio: result.audio,
      sessionId,
    });
  } catch (error) {
    logger.error('Error processing audio chunk:', error);
    res.status(500).json({ 
      error: 'Failed to process audio',
      message: error.message 
    });
  }
});

/**
 * Send text message in live session
 */
router.post('/session/:sessionId/message', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    const sessionRecord = activeSessions.get(sessionId);
    if (!sessionRecord) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Send message using the live session websocket
    const result = await processMessage(sessionRecord.sessionObj, message);
    
    // Update conversation history
    sessionRecord.conversationHistory.push({ role: 'user', content: message });
    sessionRecord.conversationHistory.push({ role: 'ai', content: result.text });
    
    logger.info('Message processed in live session', { sessionId, messageLength: message.length });
    
    res.json({
      success: true,
      response: result.text,
      audio: result.audio,
      sessionId,
    });
  } catch (error) {
    logger.error('Error processing message:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: error.message 
    });
  }
});

/**
 * Get session status
 */
router.get('/session/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;
  const sessionRecord = activeSessions.get(sessionId);
  
  if (!sessionRecord) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    success: true,
    sessionId,
    active: true,
    messageCount: sessionRecord.conversationHistory.length,
    duration: Date.now() - sessionRecord.startTime,
  });
});

/**
 * End live session
 */
router.post('/session/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionRecord = activeSessions.get(sessionId);
    
    if (!sessionRecord) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Close the websocket
    try {
      sessionRecord.sessionObj.session.close();
    } catch(err) {
      logger.error('Error closing websocket', err);
    }
    
    // Save session to database if patient_id exists
    if (sessionRecord.patient_id) {
      await pool.query(
        `INSERT INTO triage_sessions (
          patient_id, session_type, language, conversation_data, 
          symptoms, completed_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          sessionRecord.patient_id,
          'voice_live',
          sessionRecord.language,
          JSON.stringify({
            conversationHistory: sessionRecord.conversationHistory,
            duration: Date.now() - sessionRecord.startTime,
          }),
          sessionRecord.symptoms,
        ]
      );
    }
    
    // Remove session
    activeSessions.delete(sessionId);
    
    logger.info('Live voice session ended', { sessionId, duration: Date.now() - sessionRecord.startTime });
    
    res.json({
      success: true,
      message: 'Session ended successfully',
    });
  } catch (error) {
    logger.error('Error ending session:', error);
    res.status(500).json({ 
      error: 'Failed to end session',
      message: error.message 
    });
  }
});

// Cleanup old sessions (run periodically)
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, sessionRecord] of activeSessions.entries()) {
    if (now - sessionRecord.startTime > maxAge) {
      try {
        sessionRecord.sessionObj.session.close();
      } catch(e) {}
      activeSessions.delete(sessionId);
      logger.info('Cleaned up inactive session', { sessionId });
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

module.exports = router;