const SoccerUnsettled = require('../../models/soccerUnsettled.model');
const SoccerSettlement = require('../../models/soccerSettlement.model');
const SoccerEventState = require('../../models/soccerEventState.model');
const { settleMatchOddsAllExchanges } = require('../../services/settlement.service');

// GET /api/soccer/unsettled/summary
// Query: page (default 1), limit (default 20), openEvent (optional: 'true' | 'false' to filter)
// Returns: { data: [...], total, page, limit }
const getUnsettledSummary = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const openEventFilter = req.query.openEvent;

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
        $lookup: {
          from: 'soccereventstates',
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
          exchangeKey: '$_id.exchangeKey',
          eventId: '$_id.eventId',
          eventName: '$_id.eventName',
          markets: 1,
          openEvent: { $ifNull: ['$state.isOpen', true] },
        },
      },
    ];

    if (openEventFilter === 'true' || openEventFilter === 'false') {
      pipeline.push({
        $match: { openEvent: openEventFilter === 'true' },
      });
    }

    pipeline.push({ $sort: { eventId: 1 } });
    pipeline.push({
      $facet: {
        total: [{ $count: 'total' }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    });

    const [result] = await SoccerUnsettled.aggregate(pipeline);
    const total = result?.total?.[0]?.total ?? 0;
    const data = result?.data ?? [];

    res.json({
      success: true,
      data,
      total,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/soccer/unsettled/:eventId
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
    const records = await SoccerUnsettled.aggregate([
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

    const settlements = await SoccerSettlement.find({ eventId: String(eventId) }).lean();
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

// POST /api/soccer/settle/match-odds
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
      const row = await SoccerUnsettled.findOne({
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

    await SoccerSettlement.findOneAndUpdate(
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

// POST /api/soccer/unsettled/events/set-open
// Body: { eventId, openEvent: true | false }
const setSoccerEventOpen = async (req, res, next) => {
  try {
    const { eventId, openEvent } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: 'eventId is required',
      });
    }

    const isOpen = openEvent === true || openEvent === 'true';

    const state = await SoccerEventState.findOneAndUpdate(
      { eventId: String(eventId) },
      { eventId: String(eventId), isOpen, updatedAt: new Date() },
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
  setSoccerEventOpen,
};

