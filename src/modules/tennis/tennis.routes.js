const express = require('express');
const router = express.Router();

const {
  getUnsettledSummary,
  getUnsettledByEventId,
} = require('./tennis.controller');

router.get('/unsettled/summary', getUnsettledSummary);
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/tennis/settle/match-odds
const { settleMatchOdds } = require('./tennis.controller');
router.post('/settle/match-odds', settleMatchOdds);

module.exports = router;

