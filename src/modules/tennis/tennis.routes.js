const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const {
  getUnsettledSummary,
  getUnsettledByEventId,
  settleMatchOdds,
  setTennisEventOpen,
} = require('./tennis.controller');

// Require authentication for all tennis routes
router.use(protect);

router.get('/unsettled/summary', getUnsettledSummary);
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/tennis/settle/match-odds
router.post('/settle/match-odds', settleMatchOdds);

// POST /api/tennis/unsettled/events/set-open — body: { eventId, openEvent: true | false }
router.post('/unsettled/events/set-open', setTennisEventOpen);

module.exports = router;

