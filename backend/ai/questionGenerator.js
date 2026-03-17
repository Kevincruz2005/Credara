const gradient = require('./gradientClient');

async function generateQuestions(structuredData) {
  console.log('[AI] questionGenerator: generating 3 questions...');
  const res = await gradient.chat.completions.create({
    model: 'llama3.3-70b-instruct',
    messages: [
      {
        role: 'system',
        content: `You generate smart follow-up questions for reference verification of informal workers.
Given a worker profile, create 3 questions that ONLY a real employer or client who worked with this person would know.
Return ONLY a JSON array of 3 strings (no markdown fences):
["question1", "question2", "question3"]`
      },
      {
        role: 'user',
        content: `Worker profile: ${JSON.stringify(structuredData)}`
      }
    ],
    max_tokens: 300,
    temperature: 0.3
  });

  const raw = res.choices[0].message.content;
  console.log('[AI] questionGenerator result:', raw.substring(0, 200));
  const clean = raw.replace(/```json|```/gi, '').replace(/^json\s*/i, '').trim();
  return JSON.parse(clean);
}

module.exports = { generateQuestions };
