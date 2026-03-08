require('dotenv').config({ path: './.env' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

async function testGenerate() {
  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: 'Hello! This is a test.'
    });
    console.log(response.text);
  } catch (error) {
    console.error(error);
  }
}

testGenerate();