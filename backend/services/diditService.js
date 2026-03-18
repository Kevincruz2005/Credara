const axios = require('axios');
const db = require('../db');

async function createVerificationSession(workerId) {
  try {
    const url = 'https://verification.didit.me/v3/session/';
    const headers = {
      'x-api-key': process.env.DIDIT_API_KEY,
      'Content-Type': 'application/json'
    };
    const body = {
      vendor_data:  `worker_${workerId}`,
      callback:     `${process.env.WEBHOOK_BASE_URL}/api/fraud/id-callback`,
    };
    console.log('[diditService] POST', url, '| keyPrefix:', process.env.DIDIT_API_KEY?.slice(0, 10));
    const res = await axios.post(url, body, { headers });
    console.log('[diditService] session created:', res.data?.session_url?.slice(0, 60));
    return res.data.session_url || res.data.url;
  } catch (err) {
    console.error('[diditService] createVerificationSession error:', err.message);
    if (err.response) console.error('[diditService] response:', err.response.status, JSON.stringify(err.response.data));
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
