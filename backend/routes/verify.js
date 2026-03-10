const express = require('express');
const router = express.Router();
const { verifyProfile } = require('../controllers/verifyController');

// Public — no auth required
router.get('/:share_link', verifyProfile);

module.exports = router;
