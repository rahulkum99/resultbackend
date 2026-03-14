const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const {
  getUnsettledSummary,
  getUnsettledByEventId,
  settleMatchOdds,
  openCricketEvent,
  closeCricketEvent,
} = require('./cricket.controller');

// Require authentication for all cricket routes
router.use(protect);

// GET /api/cricket/unsettled/summary
router.get('/unsettled/summary', getUnsettledSummary);

// GET /api/cricket/unsettled/:eventId
router.get('/unsettled/:eventId', getUnsettledByEventId);

// POST /api/cricket/settle/match-odds
router.post('/settle/match-odds', settleMatchOdds);

// POST /api/cricket/unsettled/events/:eventId/open
router.post('/unsettled/events/:eventId/open', openCricketEvent);

// POST /api/cricket/unsettled/events/:eventId/close
router.post('/unsettled/events/:eventId/close', closeCricketEvent);

module.exports = router;

