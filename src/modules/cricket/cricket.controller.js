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
            exchangeKey: '$exchangeKey',
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
            exchangeKey: '$_id.exchangeKey',
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
          exchangeKey: '$_id.exchangeKey',
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

    const records = await CricketUnsettled.find(
      { eventId: String(eventId), openBets: { $gt: 0 } },
      {
        // explicit projection to control what goes out
        exchangeKey: 1,
        exchangeBaseUrl: 1,
        eventId: 1,
        eventName: 1,
        marketId: 1,
        marketName: 1,
        selectionId: 1,
        selectionName: 1,
        openBets: 1,
        totalStake: 1,
        totalExposure: 1,
        section: 1,
        inplay: 1,
        lastSeenAt: 1,
        _id: 0,
      }
    ).sort({ marketId: 1, selectionId: 1 });

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

