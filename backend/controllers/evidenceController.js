const db = require('../db');
const { parseStatement } = require('../services/mobileMoneyParser');
const { analyzeWorkPhoto } = require('../services/photoAnalyzer');
const { savePhoto, saveVideo } = require('../services/storageService');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Helper to recalculate score after evidence upload
async function recalculateScore(profileId, workerId) {
  const workerRes  = await db.query('SELECT * FROM workers WHERE id = $1', [workerId]);
  const profileRes = await db.query('SELECT * FROM work_profiles WHERE id = $1', [profileId]);
  const refsRes    = await db.query('SELECT * FROM references WHERE profile_id = $1', [profileId]);
  const mmRes      = await db.query('SELECT * FROM mobile_money_stats WHERE profile_id = $1 ORDER BY id DESC LIMIT 1', [profileId]);
  const photosRes  = await db.query(`SELECT * FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'photo' AND is_consistent = true`, [profileId]);
  const videosRes  = await db.query(`SELECT * FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'video'`, [profileId]);

  const worker  = workerRes.rows[0];
  const profile = profileRes.rows[0];
  const refs    = refsRes.rows;
  const mmStats = mmRes.rows[0];

  const confirmed = refs.filter(r => r.status === 'confirmed');
  const avg_rating = confirmed.length > 0
    ? confirmed.reduce((s, r) => s + (r.rating || 0), 0) / confirmed.length : 0;
  const avg_followup_score = confirmed.filter(r => r.followup_score).length > 0
    ? confirmed.filter(r => r.followup_score).reduce((s, r) => s + parseFloat(r.followup_score), 0) / confirmed.filter(r => r.followup_score).length : 0;
  const fraud_flags = JSON.parse(profile.fraud_flags || '[]');
  const voip_count = refs.filter(r => r.is_voip).length;
  const fast_replies = refs.filter(r => r.reply_time_seconds && r.reply_time_seconds < 120).length;
  const prefix_cluster = fraud_flags.includes('PREFIX_CLUSTER');

  const reference_rate = (confirmed.length / Math.max(refs.length, 1)) * 20;
  const rating_score   = (avg_rating / 5) * 20;
  const story_score    = 15; // Already completed
  const followup_score = (avg_followup_score / 10) * 10;
  const id_bonus       = worker.id_verified ? 15 : 0;

  const payers    = mmStats ? mmStats.unique_payers : 0;
  const cross_ref = mmStats ? mmStats.cross_ref_matches : 0;
  const photos    = photosRes.rows.length;
  const videos    = videosRes.rows.length;

  const mobile_money_score = payers >= 10 ? 15 : payers >= 5 ? 10 : payers >= 1 ? 5 : 0;
  const cross_ref_bonus    = cross_ref * 3;
  const photo_score        = photos >= 5 ? 8 : photos >= 3 ? 5 : photos >= 1 ? 2 : 0;
  const video_score        = videos >= 2 ? 7 : videos >= 1 ? 4 : 0;

  const voip_penalty    = voip_count * -10;
  const speed_penalty   = fast_replies >= 2 ? -15 : 0;
  const cluster_penalty = prefix_cluster ? -10 : 0;

  let raw = reference_rate + rating_score + story_score + followup_score + id_bonus
    + mobile_money_score + cross_ref_bonus + photo_score + video_score
    + voip_penalty + speed_penalty + cluster_penalty;

  let score = Math.min(100, Math.max(0, raw));
  const has_evidence = payers > 0 || photos > 0 || videos > 0;

  if (!worker.id_verified && !has_evidence) score = Math.min(score, 65);
  if (!worker.id_verified &&  has_evidence) score = Math.min(score, 75);
  if ( worker.id_verified && !has_evidence) score = Math.min(score, 85);
  if ( worker.id_verified &&  has_evidence) score = Math.min(score, 100);
  if (fraud_flags.length > 2)              score = Math.min(score, 40);

  await db.query('UPDATE work_profiles SET consistency_score = $1 WHERE id = $2', [Math.round(score), profileId]);
  return Math.round(score);
}

// POST /api/evidence/upload-statement
async function uploadStatement(req, res) {
  try {
    const { profileId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    if (!profileId) return res.status(400).json({ success: false, error: 'profileId required' });

    // Get confirmed reference phones for cross-reference check
    const refsRes = await db.query(
      `SELECT phone FROM references WHERE profile_id = $1 AND status = 'confirmed'`, [profileId]
    );
    const confirmedRefPhones = refsRes.rows.map(r => r.phone);

    const stats = await parseStatement(req.file.buffer, { confirmedRefPhones });

    // Save to mobile_money_stats
    await db.query(
      `INSERT INTO mobile_money_stats
        (profile_id, statement_type, unique_payers, total_transactions, date_range_months, avg_per_month, cross_ref_matches)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [profileId, stats.statement_type, stats.unique_payer_count, stats.total_transactions,
       stats.date_range_months, stats.avg_per_month, stats.cross_ref_matches]
    );

    // Save evidence record
    await db.query(
      `INSERT INTO work_evidence (profile_id, evidence_type, ai_analysis, is_consistent)
       VALUES ($1, 'mobile_money', $2, true)`,
      [profileId, JSON.stringify(stats)]
    );

    const new_score = await recalculateScore(profileId, req.worker.id);
    res.json({
      success: true,
      data: {
        unique_payers: stats.unique_payer_count,
        total_transactions: stats.total_transactions,
        date_range_months: stats.date_range_months,
        cross_ref_matches: stats.cross_ref_matches,
        statement_type: stats.statement_type,
        new_score
      }
    });
  } catch (err) {
    console.error('[evidenceController] uploadStatement error:', err.message);
    res.status(500).json({ success: false, error: 'Statement parsing failed' });
  }
}

// POST /api/evidence/upload-photos
async function uploadPhotos(req, res) {
  try {
    const { profileId } = req.body;
    if (!req.files?.length) return res.status(400).json({ success: false, error: 'No photos uploaded' });

    const profileRes = await db.query('SELECT structured_data FROM work_profiles WHERE id = $1', [profileId]);
    const jobTitle = profileRes.rows[0]?.structured_data?.job_title || 'worker';

    let photos_saved = 0, photos_flagged = 0;

    for (const file of req.files) {
      const base64 = file.buffer.toString('base64');
      const analysis = await analyzeWorkPhoto(base64, jobTitle);

      const filename = `${uuidv4()}${path.extname(file.originalname) || '.jpg'}`;
      const fileUrl = savePhoto(file.buffer, filename);

      await db.query(
        `INSERT INTO work_evidence (profile_id, evidence_type, file_url, ai_analysis, is_consistent, confidence_score)
         VALUES ($1, 'photo', $2, $3, $4, $5)`,
        [profileId, fileUrl, JSON.stringify(analysis), analysis.consistent, analysis.confidence]
      );

      if (analysis.consistent) photos_saved++;
      else photos_flagged++;
    }

    const new_score = await recalculateScore(profileId, req.worker.id);
    res.json({ success: true, data: { photos_saved, photos_flagged, new_score } });
  } catch (err) {
    console.error('[evidenceController] uploadPhotos error:', err.message);
    res.status(500).json({ success: false, error: 'Photo upload failed' });
  }
}

// POST /api/evidence/upload-video
async function uploadVideo(req, res) {
  try {
    const { profileId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, error: 'No video uploaded' });

    const filename = `${uuidv4()}${path.extname(req.file.originalname) || '.mp4'}`;
    const video_url = saveVideo(req.file.buffer, filename);

    await db.query(
      `INSERT INTO work_evidence (profile_id, evidence_type, file_url, is_consistent)
       VALUES ($1, 'video', $2, true)`,
      [profileId, video_url]
    );

    const new_score = await recalculateScore(profileId, req.worker.id);
    res.json({ success: true, data: { video_url, new_score } });
  } catch (err) {
    console.error('[evidenceController] uploadVideo error:', err.message);
    res.status(500).json({ success: false, error: 'Video upload failed' });
  }
}

// GET /api/evidence/summary/:profileId
async function getEvidenceSummary(req, res) {
  try {
    const { profileId } = req.params;
    const mmRes     = await db.query('SELECT * FROM mobile_money_stats WHERE profile_id = $1 ORDER BY id DESC LIMIT 1', [profileId]);
    const photosRes = await db.query(`SELECT * FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'photo'`, [profileId]);
    const videosRes = await db.query(`SELECT * FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'video'`, [profileId]);

    const has_evidence = !!(mmRes.rows[0] || photosRes.rows.length || videosRes.rows.length);
    res.json({ success: true, data: {
      mobile_money_stats: mmRes.rows[0] || null,
      photos: photosRes.rows,
      videos: videosRes.rows,
      has_evidence
    }});
  } catch (err) {
    console.error('[evidenceController] getEvidenceSummary error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to get evidence summary' });
  }
}

module.exports = { uploadStatement, uploadPhotos, uploadVideo, getEvidenceSummary };
