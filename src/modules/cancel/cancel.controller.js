const { cancelMarketAllExchanges } = require('../../services/settlement.service');

// POST /api/cancel/market
// Body:
// - cancel whole market: { marketType, eventId, marketId, reason }
// - cancel one selection: { marketType, eventId, marketId, selectionId, reason }
const cancelMarket = async (req, res, next) => {
  try {
    const { marketType, eventId, marketId, selectionId, reason } = req.body;

    if (!marketType || !eventId || !marketId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'marketType, eventId, marketId and reason are required',
      });
    }

    const results = await cancelMarketAllExchanges({
      marketType,
      eventId,
      marketId,
      selectionId,
      reason,
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
  cancelMarket,
};

