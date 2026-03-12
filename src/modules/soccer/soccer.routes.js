const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const {
  getUnsettledSummary,
  getUnsettledByEventId,
} = require('./soccer.controller');

// Require authentication for all soccer routes
router.use(protect);

router.get('/unsettled/summary', getUnsettledSummary);
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/soccer/settle/match-odds
const { settleMatchOdds } = require('./soccer.controller');
router.post('/settle/match-odds', settleMatchOdds);

module.exports = router;

