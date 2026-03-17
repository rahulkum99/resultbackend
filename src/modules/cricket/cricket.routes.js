const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const {
  getUnsettledSummary,
  getUnsettledByEventId,
  settleMatchOdds,
  setCricketEventOpen,
  settleTosMarket,
  settleBookmakerFancy,
  settleFancy,
} = require('./cricket.controller');

// Require authentication for all cricket routes
router.use(protect);

// GET /api/cricket/unsettled/summary
router.get('/unsettled/summary', getUnsettledSummary);

// GET /api/cricket/unsettled/:eventId
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/cricket/settle/match-odds
router.post('/settle/match-odds', settleMatchOdds);

// POST /api/cricket/settle/tos-market
router.post('/settle/tos-market', settleTosMarket);

// POST /api/cricket/settle/bookmaker-fancy
router.post('/settle/bookmaker-fancy', settleBookmakerFancy);

// POST /api/cricket/settle/fancy
router.post('/settle/fancy', settleFancy);

// POST /api/cricket/unsettled/events/set-open — body: { eventId, openEvent: true | false }
router.post('/unsettled/events/set-open', setCricketEventOpen);

module.exports = router;

