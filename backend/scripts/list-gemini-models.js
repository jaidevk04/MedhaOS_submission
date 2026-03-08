const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('\n🤖 Fetching available Gemini models...\n');
    console.log('='.repeat(80));
    
    // Note: The Node.js SDK doesn't have a direct listModels method
    // We'll test common models instead
    const modelsToTest = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-2.0-flash-exp',
      'gemini-exp-1206',
      'gemini-exp-1121',
      'gemini-2.0-flash-thinking-exp-1219',
      'gemini-2.0-flash-thinking-exp',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash',
      'models/gemini-2.0-flash-exp'
    ];
    
    console.log('Testing common Gemini models:\n');
    
    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        const response = await result.response;
        console.log(`✅ ${modelName.padEnd(45)} - AVAILABLE`);
      } catch (error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log(`❌ ${modelName.padEnd(45)} - NOT FOUND`);
        } else {
          console.log(`⚠️  ${modelName.padEnd(45)} - ERROR: ${error.message.substring(0, 50)}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✨ Recommended models for MedhaOS:');
    console.log('   • Text Analysis: gemini-1.5-pro or gemini-1.5-flash');
    console.log('   • Audio Processing: gemini-2.0-flash-exp (if available)');
    console.log('   • Fast Responses: gemini-1.5-flash-8b\n');
    
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
