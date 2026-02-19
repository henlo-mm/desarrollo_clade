const express = require('express');
const router = express.Router();
const { decomposeTask } = require('../controllers/aiController');

router.post('/decompose', decomposeTask);

module.exports = router;
