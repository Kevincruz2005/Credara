const db = require('../db');
const { generatePDF } = require('../services/pdfService');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Safe JSON parser — handles null, empty string, and already-parsed arrays
const safeParse = (val) => {
  if (!val) return [];
  try {
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch (e) {
    return [];
  }
};

function computeBadgeLevel(worker, fraudFlags, hasEvidence) {
  if (fraudFlags.length > 2)                                     return 'FLAGGED';
  if (worker.id_verified && hasEvidence && fraudFlags.length === 0) return 'WORK_EVIDENCED';
  if (worker.id_verified && fraudFlags.length === 0)              return 'FULLY_VERIFIED';
  if (worker.id_verified && fraudFlags.length > 0)               return 'IDENTITY_VERIFIED';
  return 'SELF_REPORTED';
}

async function generateDocument(req, res) {
  try {
    const { profileId } = req.body;

    const profileRes  = await db.query('SELECT * FROM work_profiles WHERE id = $1', [profileId]);
    const workerRes   = await db.query('SELECT * FROM workers WHERE id = $1', [req.worker.id]);
    const skillsRes   = await db.query('SELECT * FROM skills WHERE profile_id = $1', [profileId]);
    const refsRes     = await db.query('SELECT * FROM reference WHERE profile_id = $1', [profileId]);
    const mmRes       = await db.query('SELECT * FROM mobile_money_stats WHERE profile_id = $1 ORDER BY id DESC LIMIT 1', [profileId]);
    const photosRes   = await db.query(`SELECT id FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'photo' AND is_consistent = true LIMIT 1`, [profileId]);
    const videosRes   = await db.query(`SELECT id FROM work_evidence WHERE profile_id = $1 AND evidence_type = 'video' LIMIT 1`, [profileId]);
    const evidenceResult = await db.query('SELECT COUNT(*) FROM work_evidence WHERE profile_id = $1', [profileId]);

    const profile = profileRes.rows[0];
    const worker  = workerRes.rows[0];
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    // Correctly derive hasEvidence from DB
    const has_evidence = parseInt(evidenceResult.rows[0].count) > 0;
    const hasEvidence  = has_evidence || !!(mmRes.rows[0] || photosRes.rows.length > 0 || videosRes.rows.length > 0);
    const fraud_flags  = safeParse(profile.fraud_flags);
    const badge_level  = computeBadgeLevel(worker, fraud_flags, hasEvidence);
    const profileText  = profile.profile_text || 'Profile pending generation.';

    const shareLink = uuidv4().split('-')[0] + '-' + (worker.name.toLowerCase().replace(/\s/g, '-'));

    const { filename } = await generatePDF({
      worker, profile,
      skills: skillsRes.rows,
      refs: refsRes.rows,
      mmStats: mmRes.rows[0] || null,
      badge_level,
      shareLink
    });

    const pdfUrl = `/documents/${filename}`;
    // Upsert — always save/update so we never return a stale share link
    await db.query(
      `INSERT INTO documents (profile_id, pdf_url, share_link)
       VALUES ($1, $2, $3)
       ON CONFLICT (profile_id) DO UPDATE SET pdf_url = EXCLUDED.pdf_url, share_link = EXCLUDED.share_link, generated_at = NOW()`,
      [profileId, pdfUrl, shareLink]
    );

    res.json({
      success: true,
      data: {
        pdfUrl,
        shareLink,
        verifyUrl: `${process.env.FRONTEND_URL}/verify/${shareLink}`
      }
    });
  } catch (err) {
    console.error('[documentsController] generateDocument error:', err.message);
    res.status(500).json({ success: false, error: 'PDF generation failed' });
  }
}

async function downloadDocument(req, res) {
  try {
    const { profileId } = req.params;
    const docRes = await db.query(`SELECT * FROM documents WHERE profile_id = $1 ORDER BY id DESC LIMIT 1`, [profileId]);
    if (!docRes.rows[0]) return res.status(404).json({ success: false, error: 'Document not found' });

    const filePath = path.join(__dirname, '../public', docRes.rows[0].pdf_url);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'File not found' });

    res.download(filePath);
  } catch (err) {
    console.error('[documentsController] downloadDocument error:', err.message);
    res.status(500).json({ success: false, error: 'Download failed' });
  }
}

module.exports = { generateDocument, downloadDocument };
