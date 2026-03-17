const axios = require('axios');
const db = require('../db');

async function createVerificationSession(workerId) {
  try {
    const res = await axios.post(
      'https://verify.didit.me/v1/session/',
      {
        client_id: process.env.DIDIT_CLIENT_ID,
        callback_url: `${process.env.WEBHOOK_BASE_URL}/api/fraud/id-callback`,
        vendor_data:  `worker_${workerId}`,
        kyc_features: { face_match: true, liveness: true, document_check: true }
      },
      { headers: { Authorization: `Bearer ${process.env.DIDIT_API_KEY}` } }
    );
    return res.data.session_url;
  } catch (err) {
    console.error('[diditService] createVerificationSession error:', err.message);
    throw new Error('Failed to create Didit verification session');
  }
}

async function handleCallback(payload) {
  const { vendor_data, status, extracted_name } = payload;
  const workerId = vendor_data?.replace('worker_', '');
  if (!workerId) return;

  if (status === 'APPROVED') {
    await db.query(
      'UPDATE workers SET id_verified = true, id_verified_at = NOW(), id_name = $1 WHERE id = $2',
      [extracted_name || null, workerId]
    );
    console.log('[diditService] Worker', workerId, 'ID verified successfully');
  } else {
    console.log('[diditService] Worker', workerId, 'verification status:', status);
  }
}

module.exports = { createVerificationSession, handleCallback };
