const OpenAI = require('openai');
const logger = require('./logger');

// Initialize Gemini client using OpenAI compatibility
const geminiClient = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

/**
 * Call Gemini AI model
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Additional options (temperature, max_tokens, etc.)
 * @returns {Promise<Object>} - AI response
 */
async function callGemini(messages, options = {}) {
  try {
    const response = await geminiClient.chat.completions.create({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      messages,
      temperature: options.temperature || parseFloat(process.env.AI_TEMPERATURE) || 0.7,
      max_tokens: options.max_tokens || parseInt(process.env.AI_MAX_TOKENS) || 2000,
      ...options
    });

    return {
      success: true,
      content: response.choices[0].message.content,
      usage: response.usage,
      model: response.model
    };
  } catch (error) {
    logger.error('Gemini API call failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Extract structured data from text using Gemini
 * @param {string} text - Input text
 * @param {string} schema - JSON schema description
 * @returns {Promise<Object>} - Extracted structured data
 */
async function extractStructuredData(text, schema) {
  const messages = [
    {
      role: 'system',
      content: `You are a medical data extraction assistant. Extract information from the given text according to the schema provided. Return only valid JSON.`
    },
    {
      role: 'user',
      content: `Text: ${text}\n\nSchema: ${schema}\n\nExtract the data and return as JSON.`
    }
  ];

  const response = await callGemini(messages, { temperature: 0.3 });
  
  if (response.success) {
    try {
      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Failed to parse Gemini response as JSON:', error.message);
      return null;
    }
  }
  
  return null;
}

/**
 * Translate text between languages
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (en, hi)
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, targetLang) {
  const langNames = {
    'en': 'English',
    'hi': 'Hindi'
  };

  const messages = [
    {
      role: 'system',
      content: `You are a medical translator. Translate the given text to ${langNames[targetLang] || targetLang}. Maintain medical terminology accuracy.`
    },
    {
      role: 'user',
      content: text
    }
  ];

  const response = await callGemini(messages, { temperature: 0.3 });
  return response.success ? response.content : text;
}

module.exports = {
  geminiClient,
  callGemini,
  extractStructuredData,
  translateText
};
