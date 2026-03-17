const db = require('../db');

async function analyzeFraudSignals(profileId) {
  try {
    const result = await db.query(
      'SELECT * FROM reference WHERE profile_id = $1',
      [profileId]
    );
    const refs = result.rows;
    const confirmed = refs.filter(r => r.status === 'confirmed');
    const flags = [];

    // Flag 1: Replies within 2 minutes (120 seconds) of SMS send
    const fastReplies = confirmed.filter(r => r.reply_time_seconds && r.reply_time_seconds < 120);
    if (fastReplies.length >= 2) flags.push('FAST_REPLIES');

    // Flag 2: 3+ refs share same first 6 digits (area code cluster)
    const allPhones = refs.map(r => r.phone ? r.phone.replace(/\D/g, '').slice(0, 6) : '');
    const grouped = allPhones.reduce((acc, prefix) => {
      if (prefix) acc[prefix] = (acc[prefix] || 0) + 1;
      return acc;
    }, {});
    if (Object.values(grouped).length > 0 && Math.max(...Object.values(grouped)) >= 3) {
      flags.push('PREFIX_CLUSTER');
    }

    // Flag 3: All 3+ confirmed within 10 minutes of each other
    if (confirmed.length >= 3) {
      const times = confirmed
        .filter(r => r.confirmed_at)
        .map(r => new Date(r.confirmed_at).getTime());
      if (times.length >= 3) {
        const spread = Math.max(...times) - Math.min(...times);
        if (spread < 10 * 60 * 1000) flags.push('SIMULTANEOUS_CONFIRMS');
      }
    }

    // Update profile's fraud_flags
    await db.query(
      'UPDATE work_profiles SET fraud_flags = $1 WHERE id = $2',
      [JSON.stringify(flags), profileId]
    );

    console.log('[fraudDetector] profileId', profileId, 'flags:', flags);
    return flags;
  } catch (err) {
    console.error('[fraudDetector] error:', err.message);
    return [];
  }
}

module.exports = { analyzeFraudSignals };
