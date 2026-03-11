const express = require('express');
const router = express.Router();

const {
  getUnsettledSummary,
  getUnsettledByEventId,
  settleMatchOdds,
} = require('./cricket.controller');

// GET /api/cricket/unsettled/summary
router.get('/unsettled/summary', getUnsettledSummary);

// GET /api/cricket/unsettled/:eventId
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/cricket/settle/match-odds
router.post('/settle/match-odds', settleMatchOdds);

module.exports = router;

