const express = require('express');
const router = express.Router();

const {
  getUnsettledSummary,
  getUnsettledByEventId,
} = require('./soccer.controller');

router.get('/unsettled/summary', getUnsettledSummary);
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/soccer/settle/match-odds
const { settleMatchOdds } = require('./soccer.controller');
router.post('/settle/match-odds', settleMatchOdds);

module.exports = router;

