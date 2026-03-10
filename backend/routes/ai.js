const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { extractSkills, followupQuestions, generateProfile } = require('../controllers/aiController');

router.post('/extract-skills',      auth, extractSkills);
router.post('/followup-questions',  auth, followupQuestions);
router.post('/generate-profile',    auth, generateProfile);

module.exports = router;
