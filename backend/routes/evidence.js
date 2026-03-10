const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const {
  uploadStatement,
  uploadPhotos,
  uploadVideo,
  getEvidenceSummary
} = require('../controllers/evidenceController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-statement', auth, upload.single('statement'), uploadStatement);
router.post('/upload-photos',    auth, upload.array('photos', 10), uploadPhotos);
router.post('/upload-video',     auth, upload.single('video'),     uploadVideo);
router.get('/summary/:profileId', auth, getEvidenceSummary);

module.exports = router;
