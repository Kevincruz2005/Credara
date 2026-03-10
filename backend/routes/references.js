const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sendReferences, handleWebhook, getStatus } = require('../controllers/referencesController');

router.post('/send',        auth, sendReferences);
router.post('/webhook',     handleWebhook);       // NO auth — Twilio calls this
router.get('/status/:profileId', auth, getStatus);

module.exports = router;
