const CricketUnsettled = require('../../models/cricketUnsettled.model');
const { settleMatchOddsAllExchanges } = require('../../services/settlement.service');

// GET /api/cricket/unsettled/summary
// Returns: [{ eventId, eventName, markets: [{ marketId, marketName, totalOpenBets }] }]
const getUnsettledSummary = async (req, res, next) => {
  try {
    const pipeline = [
      {
        $match: {
          openBets: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            eventId: '$eventId',
            eventName: '$eventName',
            marketId: '$marketId',
            marketName: '$marketName',
          },
          totalOpenBets: { $sum: '$openBets' },
        },
      },
      {
        $group: {
          _id: {
            eventId: '$_id.eventId',
            eventName: '$_id.eventName',
          },
          markets: {
            $push: {
              marketId: '$_id.marketId',
              marketName: '$_id.marketName',
              totalOpenBets: '$totalOpenBets',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          eventId: '$_id.eventId',
          eventName: '$_id.eventName',
          markets: 1,
        },
      },
      {
        $sort: { eventId: 1 },
      },
    ];

    const summary = await CricketUnsettled.aggregate(pipeline);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cricket/unsettled/:eventId
// Returns all unsettled records for a given eventId to drive settlement UI
const getUnsettledByEventId = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'eventId is required',
      });
    }

    // Stored per (eventId+marketId+selectionId). For settlement UI we return one row per market.
    const records = await CricketUnsettled.aggregate([
      {
        $match: {
          eventId: String(eventId),
          openBets: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            eventId: '$eventId',
            eventName: '$eventName',
            marketId: '$marketId',
            marketName: '$marketName',
          },
          inplay: { $first: '$inplay' },
          lastSeenAt: { $max: '$lastSeenAt' },
          section: { $first: '$section' },
          totalOpenBets: { $sum: '$openBets' },
          totalStake: { $sum: '$totalStake' },
          totalExposure: { $sum: '$totalExposure' },
          selections: {
            $push: {
              selectionId: '$selectionId',
              selectionName: '$selectionName',
              openBets: '$openBets',
              totalStake: '$totalStake',
              totalExposure: '$totalExposure',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          eventId: '$_id.eventId',
          eventName: '$_id.eventName',
          marketId: '$_id.marketId',
          marketName: '$_id.marketName',
          inplay: 1,
          lastSeenAt: 1,
          openBets: '$totalOpenBets',
          totalStake: 1,
          totalExposure: 1,
          section: {
            $map: {
              input: { $ifNull: ['$section', []] },
              as: 's',
              in: { sid: '$$s.sid', nat: '$$s.nat' },
            },
          },
          selections: 1,
        },
      },
      { $sort: { marketId: 1 } },
    ]);

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cricket/settle/match-odds
// Body: { eventId, marketId, winnerSelectionId, marketName }
const settleMatchOdds = async (req, res, next) => {
  try {
    const { eventId, marketId, winnerSelectionId, marketName } = req.body;

    if (!eventId || !marketId || !winnerSelectionId) {
      return res.status(400).json({
        success: false,
        message: 'eventId, marketId and winnerSelectionId are required',
      });
    }

    const results = await settleMatchOddsAllExchanges({
      eventId,
      marketId,
      winnerSelectionId,
      marketName,
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUnsettledSummary,
  getUnsettledByEventId,
  settleMatchOdds,
};

