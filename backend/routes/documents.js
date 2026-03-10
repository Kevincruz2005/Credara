const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateDocument, downloadDocument } = require('../controllers/documentsController');

router.post('/generate',        auth, generateDocument);
router.get('/download/:profileId', auth, downloadDocument);

module.exports = router;
