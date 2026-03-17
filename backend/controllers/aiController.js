const db = require('../db');
const { extractSkillsFromTranscript } = require('../ai/skillExtractor');
const { generateQuestions } = require('../ai/questionGenerator');
const { generateProfileText } = require('../ai/profileGenerator');
const { analyzeFraudSignals } = require('../services/fraudDetector');

// POST /api/ai/extract-skills
async function extractSkills(req, res) {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ success: false, error: 'Transcript required' });

    const extracted = await extractSkillsFromTranscript(transcript);

    // Save to work_profiles
    const profileResult = await db.query(
      `INSERT INTO work_profiles (worker_id, raw_transcript, structured_data, status)
       VALUES ($1, $2, $3, 'draft') RETURNING id`,
      [req.worker.id, transcript, JSON.stringify(extracted)]
    );
    const profileId = profileResult.rows[0].id;

    // Save skills to skills table
    if (extracted.skills && extracted.skills.length > 0) {
      for (const skill of extracted.skills) {
        await db.query(
          'INSERT INTO skills (profile_id, skill_name) VALUES ($1, $2)',
          [profileId, skill]
        );
      }
    }

    res.json({ success: true, data: { profileId, extracted } });
  } catch (err) {
    console.error('[aiController] extractSkills error:', err.message);
    res.status(500).json({ success: false, error: 'Skill extraction failed' });
  }
}

// POST /api/ai/followup-questions
async function followupQuestions(req, res) {
  try {
    const { profileId } = req.body;
    const profile = await db.query('SELECT * FROM work_profiles WHERE id = $1', [profileId]);
    if (!profile.rows[0]) return res.status(404).json({ success: false, error: 'Profile not found' });

    const structured = profile.rows[0].structured_data;
    const questions = await generateQuestions(structured);
    res.json({ success: true, data: { questions } });
  } catch (err) {
    console.error('[aiController] followupQuestions error:', err.message);
    res.status(500).json({ success: false, error: 'Question generation failed' });
  }
}

// POST /api/ai/generate-profile
async function generateProfile(req, res) {
  try {
    const { profileId, answers } = req.body;

    // Fetch all data needed for score
    const profileRes = await db.query('SELECT * FROM work_profiles WHERE id = $1', [profileId]);
    const workerRes  = await db.query('SELECT * FROM workers WHERE id = $1', [req.worker.id]);
    const refsRes    = await db.query('SELECT * FROM reference WHERE profile_id = $1', [profileId]);
    const evidenceRes = await db.query('SELECT * FROM mobile_money_stats WHERE profile_id = $1', [profileId]);
    const photosRes  = await db.query(`SELECT * FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'photo' AND is_consistent = true`, [profileId]);
    const videosRes  = await db.query(`SELECT * FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'video'`, [profileId]);

    const profile  = profileRes.rows[0];
    const worker   = workerRes.rows[0];
    const refs     = refsRes.rows;
    const mmStats  = evidenceRes.rows[0];

    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    // Generate profile text
    const profileText = await generateProfileText({
      worker,
      profile,
      refs,
      answers: answers || []
    });

    // ---- V3 SCORE FORMULA ----
    const confirmed = refs.filter(r => r.status === 'confirmed');
    const total     = refs.length;
    const avg_rating = confirmed.length > 0
      ? confirmed.reduce((s, r) => s + (r.rating || 0), 0) / confirmed.length : 0;
    const avg_followup_score = confirmed.filter(r => r.followup_score).length > 0
      ? confirmed.filter(r => r.followup_score).reduce((s, r) => s + r.followup_score, 0) / confirmed.filter(r => r.followup_score).length : 0;

    const fraud_flags = JSON.parse(profile.fraud_flags || '[]');
    const voip_count  = refs.filter(r => r.is_voip).length;
    const fast_replies = refs.filter(r => r.reply_time_seconds && r.reply_time_seconds < 120).length;
    const prefix_cluster = fraud_flags.includes('PREFIX_CLUSTER');

    // Base signals (reduced from v2 to make room for Layer 7)
    const reference_rate = (confirmed.length / Math.max(total, 1)) * 20;
    const rating_score   = (avg_rating / 5) * 20;
    const story_score    = (answers && answers.length > 0) ? 15 : 0;
    const followup_score = (avg_followup_score / 10) * 10;
    const id_bonus       = worker.id_verified ? 15 : 0;

    // Layer 7 evidence signals
    const payers = mmStats ? mmStats.unique_payers : 0;
    const cross_ref = mmStats ? mmStats.cross_ref_matches : 0;
    const photos = photosRes.rows ? photosRes.rows.length : 0;
    const videos = videosRes.rows ? videosRes.rows.length : 0;

    const mobile_money_score = payers >= 10 ? 15 : payers >= 5 ? 10 : payers >= 1 ? 5 : 0;
    const cross_ref_bonus    = cross_ref * 3;
    const photo_score        = photos >= 5 ? 8 : photos >= 3 ? 5 : photos >= 1 ? 2 : 0;
    const video_score        = videos >= 2 ? 7 : videos >= 1 ? 4 : 0;

    // Fraud penalties
    const voip_penalty    = voip_count * -10;
    const speed_penalty   = fast_replies >= 2 ? -15 : 0;
    const cluster_penalty = prefix_cluster ? -10 : 0;

    let raw = reference_rate + rating_score + story_score + followup_score + id_bonus
      + mobile_money_score + cross_ref_bonus + photo_score + video_score
      + voip_penalty + speed_penalty + cluster_penalty;

    let score = Math.min(100, Math.max(0, raw));

    // 5-tier score caps
    const has_evidence = payers > 0 || photos > 0 || videos > 0;
    if (!worker.id_verified && !has_evidence) score = Math.min(score, 65);
    if (!worker.id_verified &&  has_evidence) score = Math.min(score, 75);
    if ( worker.id_verified && !has_evidence) score = Math.min(score, 85);
    if ( worker.id_verified &&  has_evidence) score = Math.min(score, 100);
    if (fraud_flags.length > 2)              score = Math.min(score, 40);

    // Save back to profile
    await db.query(
      `UPDATE work_profiles SET profile_text = $1, consistency_score = $2, status = 'complete' WHERE id = $3`,
      [profileText, Math.round(score), profileId]
    );

    res.json({ success: true, data: { profileText, consistencyScore: Math.round(score), fraudFlags: fraud_flags } });
  } catch (err) {
    console.error('[aiController] generateProfile error:', err.message);
    res.status(500).json({ success: false, error: 'Profile generation failed' });
  }
}

// GET /api/ai/my-profile
async function getMyProfile(req, res) {
  try {
    const result = await db.query(
      `SELECT * FROM work_profiles WHERE worker_id = $1 AND status = 'complete' ORDER BY id DESC LIMIT 1`,
      [req.worker.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ success: false, error: 'No complete profile found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[aiController] getMyProfile error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
}

module.exports = { extractSkills, followupQuestions, generateProfile, getMyProfile };
