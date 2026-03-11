const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { extractSkills, followupQuestions, generateProfile, getMyProfile } = require('../controllers/aiController');

router.post('/extract-skills',      auth, extractSkills);
router.post('/followup-questions',  auth, followupQuestions);
router.post('/generate-profile',    auth, generateProfile);
router.get('/my-profile',           auth, getMyProfile);

module.exports = router;
