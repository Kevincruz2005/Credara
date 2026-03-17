const twilio = require('twilio');

async function checkPhoneRisk(phone) {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  try {
    const lookup = await client.lookups.v2
      .phoneNumbers(phone)
      .fetch({ fields: ['line_type_intelligence'] });

    const lineType = lookup.lineTypeIntelligence?.type;
    const riskFlags = [];

    if (['voip', 'virtual', 'toll-free'].includes(lineType)) {
      riskFlags.push('VOIP_NUMBER');
    }
    if (lineType === 'nonFixedVoip') {
      riskFlags.push('NON_FIXED_VOIP');
    }

    // nonFixedVoip is highest-risk — block entirely, don't just flag
    const isBlocked = lineType === 'nonFixedVoip';

    return { lineType: lineType || 'unknown', riskFlags, isSafe: riskFlags.length === 0, isBlocked };
  } catch (err) {
    console.error('[phoneIntelligence] Lookup failed for', phone, err.message);
    // Fail open — don't block on lookup error
    return { lineType: 'unknown', riskFlags: [], isSafe: true, isBlocked: false };
  }
}

module.exports = { checkPhoneRisk };
