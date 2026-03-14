const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const {
  getUnsettledSummary,
  getUnsettledByEventId,
  settleMatchOdds,
  openSoccerEvent,
  closeSoccerEvent,
} = require('./soccer.controller');

// Require authentication for all soccer routes
router.use(protect);

router.get('/unsettled/summary', getUnsettledSummary);
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/soccer/settle/match-odds
router.post('/settle/match-odds', settleMatchOdds);

// POST /api/soccer/unsettled/events/:eventId/open
router.post('/unsettled/events/:eventId/open', openSoccerEvent);

// POST /api/soccer/unsettled/events/:eventId/close
router.post('/unsettled/events/:eventId/close', closeSoccerEvent);

module.exports = router;

