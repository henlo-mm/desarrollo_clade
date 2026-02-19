const express = require('express');
const router = express.Router();
const projectRoutes = require('./projects');
const aiRoutes = require('./ai');

router.use('/projects', projectRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
