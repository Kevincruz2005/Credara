const db = require('../db');

function computeBadgeLevel(worker, fraudFlags, hasEvidence) {
  if (fraudFlags.length > 2) return 'FLAGGED';
  if (worker.id_verified && hasEvidence && fraudFlags.length === 0) return 'WORK_EVIDENCED';
  if (worker.id_verified && fraudFlags.length === 0) return 'FULLY_VERIFIED';
  if (worker.id_verified && fraudFlags.length > 0)   return 'IDENTITY_VERIFIED';
  return 'SELF_REPORTED';
}

async function verifyProfile(req, res) {
  try {
    const { share_link } = req.params;
    console.log('[verify] looking up share_link:', share_link);

    const docRes = await db.query('SELECT * FROM documents WHERE share_link = $1', [share_link]);
    console.log('[verify] found document:', docRes.rows[0]);
    if (!docRes.rows[0]) return res.status(404).json({ success: false, error: 'Profile not found' });

    const doc = docRes.rows[0];
    const profileRes = await db.query('SELECT * FROM work_profiles WHERE id = $1', [doc.profile_id]);
    const profile = profileRes.rows[0];

    const workerRes = await db.query('SELECT id, name, id_verified, created_at FROM workers WHERE id = $1', [profile.worker_id]);
    const worker = workerRes.rows[0];

    const skillsRes = await db.query('SELECT skill_name FROM skills WHERE profile_id = $1', [doc.profile_id]);
    const refsRes   = await db.query(`SELECT * FROM reference WHERE profile_id = $1 AND status = 'confirmed'`, [doc.profile_id]);
    const mmRes     = await db.query('SELECT * FROM mobile_money_stats WHERE profile_id = $1 ORDER BY id DESC LIMIT 1', [doc.profile_id]);
    const photosRes = await db.query(`SELECT file_url FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'photo' AND is_consistent = true`, [doc.profile_id]);
    const videoRes  = await db.query(`SELECT file_url FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'video' ORDER BY id DESC LIMIT 1`, [doc.profile_id]);

    // Log verification view
    await db.query('INSERT INTO verifications (profile_id, verifier_type) VALUES ($1, $2)', [doc.profile_id, 'web']);

    const structured  = profile.structured_data || {};
    let fraud_flags = [];
    try {
      const raw = profile.fraud_flags;
      if (Array.isArray(raw)) fraud_flags = raw;
      else if (raw && typeof raw === 'string' && raw.trim()) fraud_flags = JSON.parse(raw);
    } catch { fraud_flags = []; }
    const mmStats     = mmRes.rows[0] || null;
    const hasEvidence = !!(mmStats || photosRes.rows.length > 0 || videoRes.rows[0]);
    const badge_level = computeBadgeLevel(worker, fraud_flags, hasEvidence);

    const confirmedRefs = refsRes.rows;
    const avg_rating = confirmedRefs.length > 0
      ? (confirmedRefs.reduce((s, r) => s + (r.rating || 0), 0) / confirmedRefs.length).toFixed(1) : null;

    res.json({
      success: true,
      data: {
        name: worker.name,
        jobTitle: structured.job_title,
        yearsExperience: structured.years_experience,
        consistencyScore: profile.consistency_score,
        skills: skillsRes.rows.map(s => s.skill_name),
        profileText: profile.profile_text,
        confirmedReferences: confirmedRefs.length,
        averageRating: avg_rating,
        id_verified: worker.id_verified,
        badge_level,
        fraud_flags, // Shown to verifiers only
        work_evidence_summary: {
          unique_payers: mmStats?.unique_payers || 0,
          cross_ref_matches: mmStats?.cross_ref_matches || 0,
          date_range_months: mmStats?.date_range_months || 0,
          statement_type: mmStats?.statement_type || null,
          photos: photosRes.rows.map(p => p.file_url),
          video_url: videoRes.rows[0]?.file_url || null,
          has_evidence: hasEvidence
        },
        verifiedAt: doc.generated_at,
        accountAge: Math.floor((Date.now() - new Date(worker.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (err) {
    console.error('[verifyController] error:', err.message);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
}

module.exports = { verifyProfile };
