const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { transcribe } = require('../controllers/voiceController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/transcribe', auth, upload.single('audio'), transcribe);

module.exports = router;
