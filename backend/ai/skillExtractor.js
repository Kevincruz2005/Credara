const gradient = require('./gradientClient');

async function extractSkillsFromTranscript(transcript) {
  console.log('[AI] skillExtractor: extracting from transcript...');
  const res = await gradient.chat.completions.create({
    model: 'llama3.3-70b-instruct',
    messages: [
      {
        role: 'system',
        content: `You are a professional skills extractor. Read this informal worker's transcript and extract their professional information.
Return ONLY valid JSON with this exact structure (no markdown fences):
{
  "job_title": "string — primary job title",
  "years_experience": number,
  "work_type": "string — e.g. full-time, part-time, freelance",
  "skills": ["skill1", "skill2", ...],
  "summary": "string — 1-2 sentence summary of their work"
}`
      },
      { role: 'user', content: transcript }
    ],
    max_tokens: 500,
    temperature: 0.1
  });

  const raw = res.choices[0].message.content;
  console.log('[AI] skillExtractor result:', raw.substring(0, 200));
  const clean = raw.replace(/```json|```/gi, '').replace(/^json\s*/i, '').trim();
  return JSON.parse(clean);
}

module.exports = { extractSkillsFromTranscript };
