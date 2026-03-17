const { default: OpenAI } = require('openai');
require('dotenv').config();

if (!process.env.GRADIENT_MODEL_KEY) {
  console.warn('⚠️  GRADIENT_MODEL_KEY not set');
}

const gradient = new OpenAI({
  apiKey: process.env.GRADIENT_MODEL_KEY,
  baseURL: process.env.GRADIENT_BASE_URL || 'https://api.groq.com/openai/v1',
});

module.exports = gradient;
