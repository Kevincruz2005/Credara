const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Colors matching rules.md design system
const COLORS = {
  primary:    '#1A56DB',
  background: '#FFFFFF',
  surface:    '#F9FAFB',
  text:       '#111827',
  gray:       '#6B7280',
  success:    '#059669',
  warning:    '#D97706',
  error:      '#DC2626',
  teal:       '#0D9488',
  diamond:    '#0369A1',
};

function getBadgeInfo(badge_level) {
  switch (badge_level) {
    case 'WORK_EVIDENCED':    return { label: '💎 WORK EVIDENCED',    color: COLORS.diamond };
    case 'FULLY_VERIFIED':    return { label: '✅ FULLY VERIFIED',    color: COLORS.success };
    case 'IDENTITY_VERIFIED': return { label: '✅ IDENTITY VERIFIED', color: COLORS.primary };
    case 'SELF_REPORTED':     return { label: '🔵 SELF REPORTED',     color: COLORS.gray };
    case 'FLAGGED':           return { label: '⚠️ FLAGGED',           color: COLORS.warning };
    default:                  return { label: 'UNVERIFIED',           color: COLORS.gray };
  }
}

function getScoreColor(score) {
  if (score >= 80) return COLORS.success;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
}

async function generatePDF({ worker, profile, skills, refs, mmStats, badge_level, shareLink }) {
  const outputDir = path.join(__dirname, '../public/documents');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const filename = `${shareLink || uuidv4()}.pdf`;
  const outputPath = path.join(outputDir, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const structured = profile.structured_data || {};
    const score = profile.consistency_score || 0;
    const confirmed = refs.filter(r => r.status === 'confirmed');
    const avg_rating = confirmed.length > 0
      ? (confirmed.reduce((s, r) => s + (r.rating || 0), 0) / confirmed.length).toFixed(1) : 'N/A';
    const badge = getBadgeInfo(badge_level);

    // --- HEADER BAR ---
    doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold')
      .text('CREDARA VERIFIED PROFILE', 50, 25);
    doc.fontSize(11).font('Helvetica').fillColor('#B3D4FF')
      .text('credara.app  |  Your Work. Verified.', 50, 52);

    // --- BADGE ---
    doc.fillColor(badge.color).fontSize(13).font('Helvetica-Bold')
      .text(badge.label, 50, 100);

    // --- WORKER INFO ---
    doc.fillColor(COLORS.text).fontSize(20).font('Helvetica-Bold')
      .text(worker.name, 50, 125);
    doc.fontSize(13).font('Helvetica').fillColor(COLORS.gray)
      .text(`${structured.job_title || 'Worker'}  •  ${structured.years_experience || 0} years experience`, 50, 150);

    // --- SCORE CIRCLE (text representation) ---
    const scoreColor = getScoreColor(score);
    doc.fillColor(scoreColor).fontSize(40).font('Helvetica-Bold')
      .text(`${score}%`, 430, 100, { width: 100, align: 'center' });
    doc.fillColor(COLORS.gray).fontSize(10).font('Helvetica')
      .text('VERIFICATION SCORE', 415, 145, { width: 130, align: 'center' });

    // --- DIVIDER ---
    doc.moveTo(50, 180).lineTo(doc.page.width - 50, 180).strokeColor('#E5E7EB').stroke();

    // --- SKILLS ---
    doc.fillColor(COLORS.text).fontSize(13).font('Helvetica-Bold').text('Verified Skills', 50, 195);
    const skillNames = skills.map(s => s.skill_name || s).join('  •  ');
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica').text(skillNames || 'Not specified', 50, 215);

    // --- PROFILE TEXT ---
    doc.fillColor(COLORS.text).fontSize(13).font('Helvetica-Bold').text('Professional Profile', 50, 255);
    doc.fillColor(COLORS.text).fontSize(11).font('Helvetica')
      .text(profile.profile_text || 'No profile generated.', 50, 275, { width: doc.page.width - 100 });

    // --- REFERENCES ---
    let refY = doc.y + 20;
    doc.fillColor(COLORS.text).fontSize(13).font('Helvetica-Bold').text('References', 50, refY);
    refY += 20;
    doc.fillColor(COLORS.gray).fontSize(11).font('Helvetica')
      .text(`${confirmed.length} confirmed  •  Average rating: ${avg_rating}/5`, 50, refY);

    // --- WORK EVIDENCE ---
    if (mmStats) {
      let evY = doc.y + 20;
      doc.fillColor(COLORS.teal).fontSize(13).font('Helvetica-Bold').text('💎 Work Evidence', 50, evY);
      evY += 20;
      doc.fillColor(COLORS.text).fontSize(11).font('Helvetica')
        .text(`${mmStats.unique_payers} unique payment clients over ${mmStats.date_range_months} months`, 50, evY);
      if (mmStats.cross_ref_matches > 0) {
        doc.fillColor(COLORS.success).text(`✓ ${mmStats.cross_ref_matches} payers cross-verified with references`, 50, doc.y + 5);
      }
    }

    // --- QR CODE / SHARE LINK ---
    let linkY = doc.y + 25;
    doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold')
      .text(`Verify at: credara.app/verify/${shareLink}`, 50, linkY);

    // --- DISCLAIMER (required on every PDF) ---
    const disclaimerY = doc.page.height - 100;
    doc.rect(0, disclaimerY - 10, doc.page.width, 110).fill('#F9FAFB');
    doc.fillColor(COLORS.gray).fontSize(9).font('Helvetica')
      .text(
        'DISCLAIMER: This document was generated by Credara, an AI-assisted verification platform. ' +
        'Credara does not guarantee employment suitability or character. ' +
        'Verification scores reflect data provided by the worker and their references. ' +
        'Employers should perform their own due diligence. ' +
        'Fraud flags, where present, are shared transparently for informed decision-making.',
        50, disclaimerY, { width: doc.page.width - 100 }
      );

    doc.end();
    stream.on('finish', () => resolve({ filename, outputPath }));
    stream.on('error', reject);
  });
}

module.exports = { generatePDF };
