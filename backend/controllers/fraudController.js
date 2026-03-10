const { createVerificationSession, handleCallback } = require('../services/diditService');

async function startIdVerify(req, res) {
  try {
    const verification_url = await createVerificationSession(req.worker.id);
    res.json({ success: true, data: { verification_url } });
  } catch (err) {
    console.error('[fraudController] startIdVerify error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to start ID verification' });
  }
}

async function idCallback(req, res) {
  try {
    await handleCallback(req.body);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[fraudController] idCallback error:', err.message);
    res.status(200).json({ received: true }); // Always 200 to Didit
  }
}

module.exports = { startIdVerify, idCallback };
