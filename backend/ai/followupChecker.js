const gradient = require('./gradientClient');
const twilio = require('twilio');
const db = require('../db');

function getTwilioClient() {
  return twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
}

async function sendFollowupQuestion(referenceId, referencePhone, workerProfile) {
  const questions = [
    `Roughly what year did ${workerProfile.name} first work with you?`,
    `What type of work did ${workerProfile.name} mainly do for you?`,
    `How often did ${workerProfile.name} work for you? (e.g. daily, weekly, occasionally)`,
  ];
  const q = questions[Math.floor(Math.random() * questions.length)];

  await getTwilioClient().messages.create({
    body: `One quick question about ${workerProfile.name}: ${q} (Reply in one sentence)`,
    from: process.env.TWILIO_PHONE,
    to: referencePhone
  });

  await db.query(
    'UPDATE references SET followup_question = $1 WHERE id = $2',
    [q, referenceId]
  );
  console.log('[AI] followupChecker: sent follow-up question to ref', referenceId);
}

async function scoreFollowupAnswer(answer, workerProfile) {
  console.log('[AI] followupChecker: scoring answer...');
  const res = await gradient.chat.completions.create({
    model: 'llama3.3-70b-instruct',
    messages: [
      {
        role: 'system',
        content: `Worker profile: ${JSON.stringify(workerProfile)}.
A reference answered a follow-up question with: '${answer}'.
Score 0-10 how consistent and knowledgeable this answer is with the worker's profile.
A score of 10 means the answer perfectly matches real knowledge of working with this person.
A score of 0 means it is vague, impossible, or inconsistent.
Return ONLY JSON: { "score": number, "reason": "string" }`
      }
    ],
    max_tokens: 100,
    temperature: 0.1
  });

  const raw = res.choices[0].message.content;
  console.log('[AI] followupChecker result:', raw);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { sendFollowupQuestion, scoreFollowupAnswer };
