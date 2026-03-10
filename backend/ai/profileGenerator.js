const gradient = require('./gradientClient');

async function generateProfileText({ worker, profile, refs, answers }) {
  const confirmed = refs.filter(r => r.status === 'confirmed');
  const structured = profile.structured_data || {};

  console.log('[AI] profileGenerator: generating professional profile...');
  const res = await gradient.chat.completions.create({
    model: 'llama3.3-70b-instruct',
    messages: [
      {
        role: 'system',
        content: `You write professional 3-paragraph work identity profiles for informal workers.
Write in third person. Facts only — no fabrication. 150-200 words total.
Paragraph 1: Who they are and their work background.
Paragraph 2: Their skills and what they are known for.
Paragraph 3: Their track record and verified references.
Return ONLY the plain text, no headings, no markdown.`
      },
      {
        role: 'user',
        content: `Worker: ${worker.name}
Job Title: ${structured.job_title || 'Worker'}
Years Experience: ${structured.years_experience || 0}
Skills: ${(structured.skills || []).join(', ')}
Summary: ${structured.summary || ''}
Confirmed References: ${confirmed.length}
Average Rating: ${confirmed.length > 0 ? (confirmed.reduce((s, r) => s + (r.rating || 0), 0) / confirmed.length).toFixed(1) : 'N/A'}
Worker's Story Answers: ${JSON.stringify(answers || [])}`
      }
    ],
    max_tokens: 400,
    temperature: 0.4
  });

  const text = res.choices[0].message.content.trim();
  console.log('[AI] profileGenerator result: generated', text.length, 'chars');
  return text;
}

module.exports = { generateProfileText };
