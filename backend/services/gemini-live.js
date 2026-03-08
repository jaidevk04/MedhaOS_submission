const { GoogleGenAI } = require('@google/genai');
const logger = require('../config/logger');
const { transcribeResponseAudio } = require('./gemini-voice');
const { createWavHeader } = require('../utils/wav');

// Initialize Gemini client using the new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Create a live session configuration for medical triage
 */
function createLiveSessionConfig(language = 'en') {
  const systemInstructions = {
    en: `You are a compassionate medical triage AI assistant. Your role is to:
1. Listen carefully to the patient's symptoms
2. Ask relevant follow-up questions to understand their condition
3. Identify symptoms and assess urgency
4. Provide immediate precautions
5. Recommend appropriate care level (emergency, urgent care, or routine appointment)
6. Be empathetic and reassuring
7. Keep responses concise and clear (2-3 sentences max)
8. Speak naturally as if in a real conversation

Important: You are conducting a voice conversation, so keep responses conversational and brief. After gathering enough information, provide a summary and recommendation.`,
    hi: `आप एक सहानुभूतिपूर्ण चिकित्सा ट्राइएज AI सहायक हैं। आपकी भूमिका है:
1. रोगी के लक्षणों को ध्यान से सुनें
2. उनकी स्थिति को समझने के लिए प्रासंगिक अनुवर्ती प्रश्न पूछें
3. लक्षणों की पहचान करें और तात्कालिकता का आकलन करें
4. तत्काल सावधानियां प्रदान करें
5. उपयुक्त देखभाल स्तर की सिफारिश करें
6. सहानुभूतिपूर्ण और आश्वस्त करने वाले रहें
7. प्रतिक्रियाएं संक्षिप्त और स्पष्ट रखें (अधिकतम 2-3 वाक्य)
8. स्वाभाविक रूप से बोलें जैसे कि वास्तविक बातचीत में

महत्वपूर्ण: आप एक वॉइस बातचीत कर रहे हैं, इसलिए प्रतिक्रियाएं संवादात्मक और संक्षिप्त रखें। पर्याप्त जानकारी एकत्र करने के बाद, सारांश और सिफारिश प्रदान करें।`
  };

  return {
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    systemInstruction: systemInstructions[language] || systemInstructions.en,
  };
}

/**
 * Initialize Gemini Live session using WebSockets
 */
async function initializeLiveSession(language = 'en') {
  try {
    const config = createLiveSessionConfig(language);
    
    // State to hold the current resolve function for HTTP requests
    const sessionState = {
      resolveCurrentRequest: null,
      accumulatedAudio: [],
    };

    const session = await ai.live.connect({
      model: config.model,
      config: {
        systemInstruction: { parts: [{ text: config.systemInstruction }] },
        // Use AUDIO modality for the native audio model
        responseModalities: ["AUDIO"],
      },
      callbacks: {
        onopen: () => {
          logger.info('Connected to Gemini Live API', { language });
        },
        onmessage: async (message) => {
          if (message.serverContent && message.serverContent.modelTurn && message.serverContent.modelTurn.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.inlineData && part.inlineData.data) {
                sessionState.accumulatedAudio.push(Buffer.from(part.inlineData.data, 'base64'));
              }
            }
          }
          // The server sends a turnComplete message when it finishes generating
          if (message.serverContent && message.serverContent.turnComplete) {
            if (sessionState.resolveCurrentRequest) {
              let finalAudio = null;
              let transcriptText = language === 'hi' ? '[AI वॉइस रेस्पॉन्स]' : '[AI Voice Response]';
              
              if (sessionState.accumulatedAudio.length > 0) {
                const finalBuffer = Buffer.concat(sessionState.accumulatedAudio);
                finalAudio = finalBuffer.toString('base64');
                
                // Transcribe the generated audio back to text to display to the user
                try {
                  const wavBuffer = createWavHeader(finalBuffer, 24000, 1, 16);
                  const transcript = await transcribeResponseAudio(wavBuffer, 'audio/wav');
                  if (transcript) {
                    transcriptText = transcript;
                  }
                } catch (err) {
                  logger.error('Error transcribing generated audio', err);
                }
              }
              
              sessionState.resolveCurrentRequest({
                text: transcriptText,
                audio: finalAudio
              });
              
              sessionState.resolveCurrentRequest = null;
              sessionState.accumulatedAudio = [];
            }
          }
        },
        onerror: (e) => {
          logger.error('Gemini Live API error:', e);
          if (sessionState.resolveCurrentRequest) {
            sessionState.resolveCurrentRequest({ text: "Error generating response.", audio: null });
            sessionState.resolveCurrentRequest = null;
          }
        },
        onclose: (e) => {
          logger.info('Gemini Live API closed', e);
        },
      }
    });

    return { session, sessionState };
  } catch (error) {
    logger.error('Failed to initialize Gemini Live session:', error);
    throw error;
  }
}

/**
 * Process text message in live session
 */
async function processMessage(sessionObj, text) {
  const { session, sessionState } = sessionObj;
  
  return new Promise((resolve) => {
    sessionState.resolveCurrentRequest = resolve;
    sessionState.accumulatedAudio = [];
    
    session.sendClientContent({
      turns: [{
        role: 'user',
        parts: [{ text }]
      }]
    });
  });
}

/**
 * Process audio chunk in live session
 */
async function processAudioChunk(sessionObj, audioData) {
  const { session, sessionState } = sessionObj;
  
  return new Promise((resolve) => {
    sessionState.resolveCurrentRequest = resolve;
    sessionState.accumulatedAudio = [];
    
    session.sendRealtimeInput([{
      mimeType: 'audio/webm',
      data: audioData.toString('base64'),
    }]);
  });
}

module.exports = {
  initializeLiveSession,
  processMessage,
  processAudioChunk,
  createLiveSessionConfig,
};