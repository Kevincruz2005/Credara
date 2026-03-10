const OpenAI = require('openai');
require('dotenv').config();

const gradient = new OpenAI({
  apiKey:  process.env.GRADIENT_MODEL_KEY,
  baseURL: 'https://inference.do-ai.run/v1',
});

module.exports = gradient;
