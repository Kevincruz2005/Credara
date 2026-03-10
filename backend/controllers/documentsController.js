const db = require('../db');
const { generatePDF } = require('../services/pdfService');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

function computeBadgeLevel(worker, profile, refsCount) {
  const flags = JSON.parse(profile.fraud_flags || '[]');
  const hasEvidence = profile.has_evidence || false;

  if (flags.length > 2)                                    return 'FLAGGED';
  if (worker.id_verified && hasEvidence && flags.length === 0) return 'WORK_EVIDENCED';
  if (worker.id_verified && flags.length === 0)             return 'FULLY_VERIFIED';
  if (worker.id_verified && flags.length > 0)              return 'IDENTITY_VERIFIED';
  return 'SELF_REPORTED';
}

async function generateDocument(req, res) {
  try {
    const { profileId } = req.body;

    const profileRes = await db.query('SELECT * FROM work_profiles WHERE id = $1', [profileId]);
    const workerRes  = await db.query('SELECT * FROM workers WHERE id = $1', [req.worker.id]);
    const skillsRes  = await db.query('SELECT * FROM skills WHERE profile_id = $1', [profileId]);
    const refsRes    = await db.query('SELECT * FROM references WHERE profile_id = $1', [profileId]);
    const mmRes      = await db.query('SELECT * FROM mobile_money_stats WHERE profile_id = $1 ORDER BY id DESC LIMIT 1', [profileId]);

    const profile = profileRes.rows[0];
    const worker  = workerRes.rows[0];
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });

    const shareLink = uuidv4().split('-')[0] + '-' + (worker.name.toLowerCase().replace(/\s/g, '-'));
    const badge_level = computeBadgeLevel(worker, profile, refsRes.rows.length);

    const { filename } = await generatePDF({
      worker, profile,
      skills: skillsRes.rows,
      refs: refsRes.rows,
      mmStats: mmRes.rows[0] || null,
      badge_level,
      shareLink
    });

    const pdfUrl = `/documents/${filename}`;
    await db.query(
      `INSERT INTO documents (profile_id, pdf_url, share_link) VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
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
