require('dotenv').config({ path: './.env' });
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const { transcribeResponseAudio } = require('./services/gemini-voice');
const { createWavHeader } = require('./utils/wav');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

async function testLiveAPI() {
  let audioChunks = [];

  let session = await ai.live.connect({
    model: model,
    config: {
      responseModalities: ["AUDIO"],
      systemInstruction: { parts: [{ text: "You are a helpful AI." }] },
    },
    callbacks: {
      onopen: () => {
        console.log('Connected to Gemini Live API');
      },
      onmessage: async (message) => {
        if (message.serverContent && message.serverContent.modelTurn && message.serverContent.modelTurn.parts) {
          const parts = message.serverContent.modelTurn.parts;
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              audioChunks.push(Buffer.from(part.inlineData.data, 'base64'));
            }
          }
        }
        if (message.serverContent && message.serverContent.turnComplete) {
           console.log('Turn complete, audio chunks:', audioChunks.length);
           if (audioChunks.length > 0) {
              const finalAudio = Buffer.concat(audioChunks);
              console.log('Transcribing audio...');
              try {
                const wavBuffer = createWavHeader(finalAudio, 24000, 1, 16);
                const res = await transcribeResponseAudio(wavBuffer, 'audio/wav');
                console.log('Transcript:', res);
              } catch (err) {
                console.error('Transcription error:', err);
              }
           }
           process.exit(0);
        }
      },
      onerror: (e) => console.error('Error:', e),
      onclose: (e) => {
        console.log('Closed');
        process.exit(0);
      },
    }
  });

  console.log('Sending message...');
  session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: "Tell me a short joke." }] }] });
}

testLiveAPI().catch(console.error);