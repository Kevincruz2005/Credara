const gradient = require('../ai/gradientClient');

async function analyzeWorkPhoto(imageBase64, jobTitle) {
  console.log('[AI] photoAnalyzer: checking photo consistency...');
  try {
    const res = await gradient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a work photo validator. Given a description of an image and a job title, determine if the photo is consistent with someone doing that job.
Return ONLY valid JSON: { "consistent": boolean, "confidence": number (0-10), "description": "brief description of what the photo shows" }`
        },
        {
          role: 'user',
          content: `Job title: ${jobTitle}\nImage (base64 preview): ${imageBase64.substring(0, 500)}...`
        }
      ],
      max_tokens: 150,
      temperature: 0.1
    });

    const raw = res.choices[0].message.content;
    console.log('[AI] photoAnalyzer result:', raw.substring(0, 150));
    const clean = raw.replace(/```json|```/gi, '').replace(/^json\s*/i, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('[photoAnalyzer] error:', err.message);
    return { consistent: true, confidence: 5, description: 'Analysis unavailable' };
  }
}

module.exports = { analyzeWorkPhoto };
