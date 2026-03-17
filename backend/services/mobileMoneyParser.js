const gradient = require('../ai/gradientClient');
const pdfParse  = require('pdf-parse');

async function parseStatement(fileBuffer, workerProfile) {
  const pdfData = await pdfParse(fileBuffer);
  const rawText = pdfData.text.substring(0, 8000); // Token budget

  console.log('[AI] mobileMoneyParser: extracting from statement...');
  const res = await gradient.chat.completions.create({
    model: 'llama3.3-70b-instruct',
    messages: [
      {
        role: 'system',
        content: `Parse this mobile money statement. Extract:
unique_payer_count (int — count of unique people/businesses that sent money to this account),
total_transactions (int — total number of incoming transactions),
date_range_months (int — span of months covered in the statement),
avg_per_month (float — average monthly income),
payer_phones (array of strings — phone numbers that sent money to this account).
Return ONLY valid JSON. No markdown fences. No explanation.`
      },
      { role: 'user', content: rawText }
    ],
    max_tokens: 600,
    temperature: 0.1
  });

  console.log('[AI] mobileMoneyParser result:', res.choices[0].message.content.substring(0, 200));
  const clean = res.choices[0].message.content.replace(/```json|```/gi, '').replace(/^json\s*/i, '').trim();
  const extracted = JSON.parse(clean);

  // THE KEY SIGNAL: cross-reference payer phones vs confirmed reference phones
  // Same phone PAID the worker AND confirmed them as reference = near-impossible to fake
  const confirmedPhones = workerProfile.confirmedRefPhones || [];
  const cross_ref_matches = (extracted.payer_phones || []).filter(ph =>
    confirmedPhones.includes(ph)
  ).length;

  return {
    ...extracted,
    cross_ref_matches,
    statement_type: detectStatementType(rawText)
  };
}

function detectStatementType(text) {
  if (text.includes('UPI') || text.includes('BHIM'))         return 'UPI';
  if (text.includes('M-PESA') || text.includes('Safaricom')) return 'MPESA';
  if (text.includes('PIX'))                                  return 'PIX';
  if (text.includes('MTN') || text.includes('MoMo'))        return 'MTN_MOMO';
  if (text.includes('Vodafone Cash'))                        return 'VODAFONE_CASH';
  if (text.includes('OPay') || text.includes('Flutterwave')) return 'OPAY';
  return 'UNKNOWN';
}

module.exports = { parseStatement };
