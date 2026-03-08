const { GoogleGenAI } = require('@google/genai');
const logger = require('../config/logger');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

Important: You are conducting a voice conversation, so keep responses conversational and brief. After gathering enough information, provide a summary and recommendation.
When you have identified the patient's symptoms or have immediate precautions to share, call the 'record_symptoms_and_precautions' tool.
When the triage is complete and you have a final assessment and recommendation, call the 'complete_triage' tool.
If the user asks to book an appointment, ask them for their preferred date and time. Once they provide it, call the 'book_appointment' tool.
If the user says goodbye or asks to end the conversation, call the 'end_session' tool.`,
    hi: `आप एक सहानुभूतिपूर्ण चिकित्सा ट्राइएज AI सहायक हैं। आपकी भूमिका है:
1. रोगी के लक्षणों को ध्यान से सुनें
2. उनकी स्थिति को समझने के लिए प्रासंगिक अनुवर्ती प्रश्न पूछें
3. लक्षणों की पहचान करें और तात्कालिकता का आकलन करें
4. तत्काल सावधानियां प्रदान करें
5. उपयुक्त देखभाल स्तर की सिफारिश करें
6. सहानुभूतिपूर्ण और आश्वस्त करने वाले रहें
7. प्रतिक्रियाएं संक्षिप्त और स्पष्ट रखें (अधिकतम 2-3 वाक्य)
8. स्वाभाविक रूप से बोलें जैसे कि वास्तविक बातचीत में

महत्वपूर्ण: आप एक वॉइस बातचीत कर रहे हैं, इसलिए प्रतिक्रियाएं संवादात्मक और संक्षिप्त रखें। पर्याप्त जानकारी एकत्र करने के बाद, सारांश और सिफारिश प्रदान करें।
जब आपने रोगी के लक्षणों की पहचान कर ली हो या साझा करने के लिए तत्काल सावधानियां हों, तो 'record_symptoms_and_precautions' टूल को कॉल करें।
जब ट्राइएज पूरा हो जाए और आपके पास अंतिम मूल्यांकन और सिफारिश हो, तो 'complete_triage' टूल को कॉल करें।
यदि उपयोगकर्ता अपॉइंटमेंट बुक करने के लिए कहता है, तो उनसे उनकी पसंदीदा तारीख और समय पूछें। जब वे इसे प्रदान करें, तो 'book_appointment' टूल को कॉल करें।
यदि उपयोगकर्ता अलविदा कहता है या बातचीत समाप्त करने के लिए कहता है, तो 'end_session' टूल को कॉल करें।`
  };

  const tools = [
    {
      functionDeclarations: [
        {
          name: 'record_symptoms_and_precautions',
          description: 'Record identified symptoms and immediate precautions based on the ongoing conversation.',
          parameters: {
            type: 'OBJECT',
            properties: {
              symptoms: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'List of identified symptoms (e.g. ["headache", "fever"])'
              },
              precautions: {
                type: 'ARRAY',
                items: { type: 'STRING' },
                description: 'List of immediate precautions or advice for the patient (e.g. ["rest in a quiet room", "drink water"])'
              }
            },
            required: ['symptoms', 'precautions']
          }
        },
        {
          name: 'complete_triage',
          description: 'Mark the triage assessment as complete with a final summary and urgency level.',
          parameters: {
            type: 'OBJECT',
            properties: {
              assessment_summary: {
                type: 'STRING',
                description: 'A brief summary of the final assessment and recommendation provided to the patient.'
              },
              urgency_level: {
                type: 'STRING',
                description: 'The determined urgency level (e.g., "emergency", "urgent", "routine").'
              }
            },
            required: ['assessment_summary', 'urgency_level']
          }
        },
        {
          name: 'book_appointment',
          description: 'Book an appointment for the patient based on their preferred date and time.',
          parameters: {
            type: 'OBJECT',
            properties: {
              date: {
                type: 'STRING',
                description: 'The preferred date for the appointment (e.g. YYYY-MM-DD or tomorrow)'
              },
              time: {
                type: 'STRING',
                description: 'The preferred time for the appointment (e.g. morning, 10:00 AM)'
              },
              specialty: {
                type: 'STRING',
                description: 'The recommended medical specialty based on symptoms (e.g. General Practice, Cardiology)'
              },
              symptoms_summary: {
                type: 'STRING',
                description: 'A brief summary of the symptoms to include in the booking notes'
              }
            },
            required: ['date', 'time', 'specialty']
          }
        },
        {
          name: 'end_session',
          description: 'End the current voice session and close the connection.',
          parameters: {
            type: 'OBJECT',
            properties: {
              reason: {
                type: 'STRING',
                description: 'The reason for ending the session (e.g., "patient requested", "triage complete")'
              }
            }
          }
        }
      ]
    }
  ];

  return {
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    systemInstruction: systemInstructions[language] || systemInstructions.en,
    tools: tools,
  };
}

module.exports = function setupLiveVoiceSocket(io) {
  io.on('connection', (socket) => {
    let geminiSession = null;

    socket.on('start_live_voice', async ({ language = 'en', patient_id }) => {
      try {
        const config = createLiveSessionConfig(language);
        
        logger.info(`Starting Live Voice Session for socket ${socket.id}`, { language, patient_id });
        
        geminiSession = await ai.live.connect({
          model: config.model,
          config: {
            systemInstruction: { parts: [{ text: config.systemInstruction }] },
            tools: config.tools,
            // Set modalities. TEXT is requested if we also want text, but AUDIO is fine for voice. Let's use both or just AUDIO. We can configure VAD.
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede" // Choose a specific voice
                }
              }
            },
            outputAudioTranscription: {}, // Request transcript of what the AI says
            inputAudioTranscription: {}, // Request transcript of what the user says
          },
          callbacks: {
            onopen: () => {
              socket.emit('live_voice_started', { status: 'success' });
            },
            onmessage: (message) => {
              // Send the raw message or formatted message to frontend
              if (message.serverContent && message.serverContent.interrupted) {
                socket.emit('live_voice_interrupted');
              }
              
              if (message.serverContent && message.serverContent.modelTurn && message.serverContent.modelTurn.parts) {
                for (const part of message.serverContent.modelTurn.parts) {
                  if (part.inlineData && part.inlineData.data) {
                    // Send audio chunk to frontend
                    socket.emit('live_voice_audio', {
                      audio: part.inlineData.data, // base64
                    });
                  }
                  // Removed emitting part.text here to avoid sending AI internal reasoning
                  // We rely on outputTranscription instead for what the AI actually "says"
                }
              }

              // Handle tool calls
              if (message.toolCall && message.toolCall.functionCalls) {
                const functionResponses = message.toolCall.functionCalls.map(fc => {
                  const name = fc.name;
                  const args = fc.args;
                  logger.info(`Gemini called function: ${name}`, args);

                  let functionResponseResult = "success";

                  if (name === 'record_symptoms_and_precautions') {
                    socket.emit('live_voice_symptoms_updated', args);
                  } else if (name === 'complete_triage') {
                    socket.emit('live_voice_assessment_complete', args);
                  } else if (name === 'book_appointment') {
                    logger.info('Booking appointment via voice', args);
                    socket.emit('live_voice_appointment_booked', {
                      ...args,
                      status: 'confirmed',
                      appointment_id: `APT-${Date.now().toString().slice(-6)}`
                    });
                    functionResponseResult = `Appointment booked successfully for ${args.date} at ${args.time}.`;
                  } else if (name === 'end_session') {
                    socket.emit('live_voice_end_session_requested', args);
                    functionResponseResult = "Session ending.";
                  }

                  return {
                    id: fc.id,
                    name: name,
                    response: { result: functionResponseResult }
                  };
                });

                // Acknowledge the function call back to Gemini
                try {
                  geminiSession.sendToolResponse({ functionResponses });
                } catch (e) {
                  logger.error('Error acknowledging function call', e);
                }
              }

              if (message.serverContent && message.serverContent.outputTranscription) {
                // Sanitize text to remove control characters and ensure proper encoding
                let text = message.serverContent.outputTranscription.text || '';
                // Remove control characters (ASCII 0-31 except newline, tab, carriage return)
                text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
                // Replace any remaining problematic patterns
                text = text.replace(/<ctrl\d+>/g, '');
                
                if (text.trim()) {
                  socket.emit('live_voice_text', {
                    text: text,
                    role: 'ai'
                  });
                }
              }

              if (message.serverContent && message.serverContent.inputTranscription) {
                // Sanitize text to remove control characters
                let text = message.serverContent.inputTranscription.text || '';
                text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
                text = text.replace(/<ctrl\d+>/g, '');
                
                if (text.trim()) {
                  socket.emit('live_voice_text', {
                    text: text,
                    role: 'user'
                  });
                }
              }

              // turn complete could signify the end of the AI's turn
              if (message.serverContent && message.serverContent.turnComplete) {
                socket.emit('live_voice_turn_complete');
              }
            },
            onerror: (e) => {
              console.error('Gemini Live API error full:', e, e.message, e.stack);
              logger.error('Gemini Live API error:', e);
              socket.emit('live_voice_error', { message: 'AI Connection Error' });
            },
            onclose: (e) => {
              console.error('Gemini Live API closed event:', e);
              logger.info('Gemini Live API closed', e);
              socket.emit('live_voice_closed');
            },
          }
        });

      } catch (error) {
        logger.error('Failed to start Gemini Live Session:', error);
        socket.emit('live_voice_error', { message: error.message });
      }
    });

    socket.on('live_voice_audio_chunk', (data) => {
      // Receive audio from microphone (Base64 PCM) and send to Gemini
      if (geminiSession && data.audio) {
        try {
          geminiSession.sendRealtimeInput(
            {
              audio: {
                data: data.audio,
                mimeType: "audio/pcm;rate=16000"
              }
            }
          );
        } catch (e) {
          logger.error('Error sending audio to Gemini:', e);
        }
      }
    });

    socket.on('live_voice_text_message', (data) => {
      // Text message
      if (geminiSession && data.text) {
        try {
          geminiSession.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: data.text }] }]
          });
        } catch (e) {
          logger.error('Error sending text to Gemini:', e);
        }
      }
    });

    const cleanup = () => {
      if (geminiSession) {
        try {
          geminiSession.close();
        } catch(e) {}
        geminiSession = null;
      }
    };

    socket.on('stop_live_voice', cleanup);
    socket.on('disconnect', cleanup);
  });
};
