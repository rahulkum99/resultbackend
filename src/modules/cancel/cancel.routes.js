const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const { cancelMarket } = require('./cancel.controller');

// Require authentication for all cancel routes
router.use(protect);

// POST /api/cancel/market
router.post('/market', cancelMarket);

module.exports = router;

