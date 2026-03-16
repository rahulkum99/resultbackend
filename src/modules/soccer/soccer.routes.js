const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const {
  getUnsettledSummary,
  getUnsettledByEventId,
  settleMatchOdds,
  setSoccerEventOpen,
} = require('./soccer.controller');

// Require authentication for all soccer routes
router.use(protect);

router.get('/unsettled/summary', getUnsettledSummary);
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/soccer/settle/match-odds
router.post('/settle/match-odds', settleMatchOdds);

// POST /api/soccer/unsettled/events/set-open — body: { eventId, openEvent: true | false }
router.post('/unsettled/events/set-open', setSoccerEventOpen);

module.exports = router;

