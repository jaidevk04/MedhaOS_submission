require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testLiveToolCalling() {
  const tools = [
    {
      functionDeclarations: [
        {
          name: 'record_symptoms',
          description: 'Record identified symptoms from the patient.',
          parameters: {
            type: 'OBJECT',
            properties: {
              symptoms: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              }
            },
            required: ['symptoms']
          }
        }
      ]
    }
  ];

  try {
    const session = await ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        systemInstruction: { parts: [{ text: "You must immediately call the 'record_symptoms' tool when the user mentions their symptoms." }] },
        tools: tools,
        responseModalities: ["AUDIO"],
      },
      callbacks: {
        onopen: () => {
          console.log('Connected to Gemini Live');
        },
        onmessage: (message) => {
          if (message.serverContent && message.serverContent.modelTurn && message.serverContent.modelTurn.parts) {
            for (const part of message.serverContent.modelTurn.parts) {
              if (part.text) {
                console.log('AI response:', part.text);
              }
              if (part.functionCall) {
                console.log('--- FUNCTION CALL RECEIVED ---', part.functionCall);
                // Call end session after successful call
                process.exit(0);
              }
            }
          }
          if (message.serverContent && message.serverContent.turnComplete) {
            console.log("Turn completed, waiting...");
            setTimeout(() => {
                console.log('Timeout. Closing.');
                process.exit(0);
            }, 3000);
          }

          if (message.toolCall) {
              console.log('--- RAW TOOL CALL RECEIVED ---', message.toolCall);
              const functionResponses = message.toolCall.functionCalls.map(fc => {
                  return {
                      id: fc.id,
                      name: fc.name,
                      response: { result: "ok" }
                  };
              });

              console.log('Sending Tool Response:', functionResponses);
              session.sendToolResponse({ functionResponses });
          }
        },
        onerror: (e) => {
          console.error('Error:', e);
          process.exit(1);
        },
        onclose: () => {
          console.log('Connection closed');
          process.exit(0);
        }
      }
    });

    console.log('Sending message to trigger tool...');
    session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: "I have a severe headache and high fever." }] }] });

  } catch (err) {
    console.error('Failed to connect:', err);
  }
}

testLiveToolCalling();
