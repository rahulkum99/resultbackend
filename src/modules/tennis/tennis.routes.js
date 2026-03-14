const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const {
  getUnsettledSummary,
  getUnsettledByEventId,
  settleMatchOdds,
  openTennisEvent,
  closeTennisEvent,
} = require('./tennis.controller');

// Require authentication for all tennis routes
router.use(protect);

router.get('/unsettled/summary', getUnsettledSummary);
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/tennis/settle/match-odds
router.post('/settle/match-odds', settleMatchOdds);

// POST /api/tennis/unsettled/events/:eventId/open
router.post('/unsettled/events/:eventId/open', openTennisEvent);

// POST /api/tennis/unsettled/events/:eventId/close
router.post('/unsettled/events/:eventId/close', closeTennisEvent);

module.exports = router;

