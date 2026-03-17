const db = require('../db');
const twilio = require('twilio');
const { checkPhoneRisk } = require('../services/phoneIntelligence');
const { analyzeFraudSignals } = require('../services/fraudDetector');
const { sendFollowupQuestion, scoreFollowupAnswer } = require('../ai/followupChecker');

// POST /api/references/send
async function sendReferences(req, res) {
  try {
    const { profileId, phones } = req.body;
    if (!profileId || !phones || !phones.length) {
      return res.status(400).json({ success: false, error: 'profileId and phones required' });
    }

    const workerRes = await db.query('SELECT * FROM workers WHERE id = $1', [req.worker.id]);
    const worker = workerRes.rows[0];
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    const references = [];

    for (const phone of phones) {
      // Layer 1: Twilio Lookup before every SMS
      const { lineType, riskFlags, isSafe, isBlocked } = await checkPhoneRisk(phone);
      const is_voip = !isSafe;

      // nonFixedVoip: block entirely — do not save or send (Tools Guide: "Block from being added at all")
      if (isBlocked) {
        return res.status(400).json({ success: false, error: `Blocked: ${phone} is a high-risk nonFixedVoip virtual number and cannot be used.` });
      }

      // Save reference record
      const refResult = await db.query(
        `INSERT INTO reference (profile_id, phone, line_type, is_voip, status, created_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW()) RETURNING id`,
        [profileId, phone, lineType, is_voip]
      );
      const refId = refResult.rows[0].id;

      // Send SMS (even regular VoIP — but mark it)
      try {
        await client.messages.create({
          body: `Did ${worker.name} work for you? Reply YES and rate them 1-5 (e.g. "YES 5"). From Credara.`,
          from: process.env.TWILIO_PHONE,
          to: phone
        });
      } catch (smsErr) {
        console.error('[referencesController] SMS send failed for', phone, smsErr.message);
      }

      references.push({ id: refId, phone, status: 'pending', is_voip, line_type: lineType });
    }

    res.json({ success: true, data: { sent: references.length, references } });
  } catch (err) {
    console.error('[referencesController] sendReferences error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to send references' });
  }
}

// POST /api/references/webhook — Twilio calls this
async function handleWebhook(req, res) {
  // Always return TwiML immediately
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');

  try {
    const from = req.body.From;
    const body = (req.body.Body || '').trim().toUpperCase();

    if (!from) return;

    // Find the reference
    const refRes = await db.query(
      `SELECT r.*, wp.worker_id, wp.id AS profile_id
       FROM reference r
       JOIN work_profiles wp ON r.profile_id = wp.id
       WHERE r.phone = $1 AND r.status = 'pending'
       ORDER BY r.id DESC LIMIT 1`,
      [from]
    );
    if (!refRes.rows[0]) return;

    const ref = refRes.rows[0];
    const profileId = ref.profile_id;

    // Check if this is a follow-up answer
    if (ref.followup_question && !ref.followup_answer) {
      // Score the follow-up answer
      const workerRes = await db.query('SELECT * FROM workers WHERE id = $1', [ref.worker_id]);
      const profileRes = await db.query('SELECT * FROM work_profiles WHERE id = $1', [profileId]);
      const { score, reason } = await scoreFollowupAnswer(req.body.Body, {
        name: workerRes.rows[0]?.name,
        ...profileRes.rows[0]?.structured_data
      });

      await db.query(
        'UPDATE reference SET followup_answer = $1, followup_score = $2 WHERE id = $3',
        [req.body.Body, score, ref.id]
      );
      return;
    }

    // Parse confirmation reply: YES/Y + optional rating
    const confirmed = body.startsWith('YES') || body.startsWith('Y');
    const ratingMatch = body.match(/(\d)/);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : null;

    // Calculate reply time
    const sentAt = new Date(ref.created_at);
    const replyTime = Math.floor((Date.now() - sentAt.getTime()) / 1000);

    await db.query(
      `UPDATE reference SET
        status = $1, rating = $2, response_text = $3,
        confirmed_at = NOW(), reply_time_seconds = $4
       WHERE id = $5`,
      [confirmed ? 'confirmed' : 'declined', rating, req.body.Body, replyTime, ref.id]
    );

    // Layer 2: Run fraud analysis after every reply
    await analyzeFraudSignals(profileId);

    // Layer 3: Send follow-up if confirmed
    if (confirmed) {
      const workerRes = await db.query('SELECT * FROM workers WHERE id = $1', [ref.worker_id]);
      const profileRes = await db.query('SELECT * FROM work_profiles WHERE id = $1', [profileId]);
      await sendFollowupQuestion(ref.id, from, {
        name: workerRes.rows[0]?.name,
        ...profileRes.rows[0]?.structured_data
      });
    }
  } catch (err) {
    console.error('[referencesController] webhook error:', err.message);
  }
}

// GET /api/references/status/:profileId
async function getStatus(req, res) {
  try {
    const { profileId } = req.params;
    const result = await db.query(
      'SELECT * FROM reference WHERE profile_id = $1 ORDER BY id ASC',
      [profileId]
    );
    const refs = result.rows;
    const confirmed = refs.filter(r => r.status === 'confirmed').length;
    const pending   = refs.filter(r => r.status === 'pending').length;

    res.json({ success: true, data: { total: refs.length, confirmed, pending, references: refs } });
  } catch (err) {
    console.error('[referencesController] getStatus error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
}

module.exports = { sendReferences, handleWebhook, getStatus };
