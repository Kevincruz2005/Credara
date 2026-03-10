const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { startIdVerify, idCallback } = require('../controllers/fraudController');

router.post('/start-id-verify', auth, startIdVerify);
router.post('/id-callback',     idCallback);    // NO auth — Didit calls this

module.exports = router;
