const CricketUnsettled = require('../../models/cricketUnsettled.model');
const CricketSettlement = require('../../models/cricketSettlement.model');
const CricketEventState = require('../../models/cricketEventState.model');
const { settleMatchOddsAllExchanges } = require('../../services/settlement.service');

// GET /api/cricket/unsettled/summary
// Returns: [{ eventId, eventName, markets: [{ marketId, marketName, totalOpenBets }], openEvent }]
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
        $lookup: {
          from: 'cricketeventstates',
          localField: '_id.eventId',
          foreignField: 'eventId',
          as: 'state',
        },
      },
      {
        $addFields: {
          state: { $arrayElemAt: ['$state', 0] },
        },
      },
      {
        $project: {
          _id: 0,
          eventId: '$_id.eventId',
          eventName: '$_id.eventName',
          markets: 1,
          openEvent: { $ifNull: ['$state.isOpen', true] },
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
          settled: { $literal: false },
          exchange_report: { $literal: [] },
        },
      },
      { $sort: { marketId: 1 } },
    ]);

    const settlements = await CricketSettlement.find({ eventId: String(eventId) }).lean();
    const byMarketId = new Map(settlements.map((s) => [s.marketId, s]));

    const data = records.map((r) => {
      const settlement = byMarketId.get(r.marketId);
      if (settlement) {
        return {
          ...r,
          settled: true,
          exchange_report: settlement.exchangeReport || [],
          winnerSelectionId: settlement.winnerSelectionId || null,
          winnerSelectionName: settlement.winnerSelectionName || null,
        };
      }
      return r;
    });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cricket/settle/match-odds
// Body: { eventId, marketId, winnerSelectionId, winnerSelectionName?, marketName }
const settleMatchOdds = async (req, res, next) => {
  try {
    const { eventId, marketId, winnerSelectionId, winnerSelectionName, marketName } = req.body;

    if (!eventId || !marketId || !winnerSelectionId) {
      return res.status(400).json({
        success: false,
        message: 'eventId, marketId and winnerSelectionId are required',
      });
    }

    let resolvedWinnerName = winnerSelectionName;
    if (resolvedWinnerName == null || resolvedWinnerName === '') {
      const row = await CricketUnsettled.findOne({
        eventId: String(eventId),
        marketId: String(marketId),
        selectionId: String(winnerSelectionId),
      }).lean();
      resolvedWinnerName = row?.selectionName || null;
    }

    const results = await settleMatchOddsAllExchanges({
      eventId,
      marketId,
      winnerSelectionId,
      marketName,
    });

    const exchangeReport = results.map((r) => ({
      exchangeKey: r.exchangeKey,
      success: r.success,
      ...(r.data != null && { data: r.data }),
      ...(r.error != null && { error: r.error }),
      ...(r.status != null && { status: r.status }),
    }));

    await CricketSettlement.findOneAndUpdate(
      { eventId: String(eventId), marketId: String(marketId) },
      {
        eventId: String(eventId),
        marketId: String(marketId),
        marketName: marketName || null,
        winnerSelectionId: String(winnerSelectionId),
        winnerSelectionName: resolvedWinnerName,
        exchangeReport,
        settledAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cricket/unsettled/events/:eventId/open
const openCricketEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'eventId is required',
      });
    }

    const state = await CricketEventState.findOneAndUpdate(
      { eventId: String(eventId) },
      { eventId: String(eventId), isOpen: true, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cricket/unsettled/events/:eventId/close
const closeCricketEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'eventId is required',
      });
    }

    const state = await CricketEventState.findOneAndUpdate(
      { eventId: String(eventId) },
      { eventId: String(eventId), isOpen: false, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: state,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUnsettledSummary,
  getUnsettledByEventId,
  settleMatchOdds,
  openCricketEvent,
  closeCricketEvent,
};

