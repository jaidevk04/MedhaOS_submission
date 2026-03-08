import api from './api';

/**
 * Transcribe audio file
 * @param {Blob} audioBlob - Audio blob from recording
 * @param {string} patientId - Optional patient ID
 * @returns {Promise} Transcription result
 */
export const transcribeAudio = async (audioBlob, patientId = null) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  if (patientId) {
    formData.append('patient_id', patientId);
  }

  const response = await api.post('/voice/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Conduct triage conversation
 * @param {string} transcript - Patient's statement
 * @param {string} patientId - Optional patient ID
 * @param {Array} conversationHistory - Previous conversation
 * @param {string} language - Language code (en, hi, etc.)
 * @returns {Promise} AI response
 */
export const conductTriageConversation = async (
  transcript,
  patientId = null,
  conversationHistory = [],
  language = 'en'
) => {
  const response = await api.post('/voice/triage-conversation', {
    transcript,
    patient_id: patientId,
    conversation_history: conversationHistory,
    language,
  });

  return response.data;
};

/**
 * Analyze symptoms
 * @param {Array} symptoms - List of symptoms
 * @param {Object} additionalInfo - Additional patient information
 * @param {string} patientId - Optional patient ID
 * @returns {Promise} Analysis result
 */
export const analyzeSymptoms = async (
  symptoms,
  additionalInfo = {},
  patientId = null
) => {
  const response = await api.post('/voice/analyze-symptoms', {
    symptoms,
    additional_info: additionalInfo,
    patient_id: patientId,
  });

  return response.data;
};

/**
 * Generate voice response (TTS)
 * @param {string} text - Text to convert to speech
 * @param {string} language - Language code
 * @param {string} voice - Voice name
 * @returns {Promise} Audio data or text
 */
export const generateVoiceResponse = async (
  text,
  language = 'en',
  voice = 'Aoede'
) => {
  const response = await api.post('/voice/generate-voice', {
    text,
    language,
    voice,
  });

  return response.data;
};

/**
 * Get triage history for a patient
 * @param {string} patientId - Patient ID
 * @returns {Promise} Triage history
 */
export const getTriageHistory = async (patientId) => {
  const response = await api.get(`/voice/history/${patientId}`);
  return response.data;
};
