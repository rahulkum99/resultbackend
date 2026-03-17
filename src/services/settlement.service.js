const axios = require('axios');
const exchanges = require('../config/exchanges');

const toMarketType = (marketName) => {
  switch ((marketName || '').toUpperCase()) {
    case 'MATCH_ODDS':
      return 'match_odds';
    default:
      return 'match_odds';
  }
};

const postSettleToAllExchanges = async (payload) => {
  const results = await Promise.allSettled(
    exchanges.map((ex) =>
      axios.post(`${ex.baseUrl}/api/bets/settle`, payload, {
        headers: {
          'X-Api-Key': ex.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      })
    )
  );

  return results.map((result, index) => {
    const ex = exchanges[index];
    if (result.status === 'fulfilled') {
      const apiSuccess =
        typeof result.value?.data?.success === 'boolean' ? result.value.data.success : true;
      return {
        exchangeKey: ex.key,
        success: apiSuccess,
        data: result.value.data,
      };
    }
    return {
      exchangeKey: ex.key,
      success: false,
      error: result.reason?.message || 'Unknown error',
      status: result.reason?.response?.status,
    };
  });
};

const postCancelToAllExchanges = async (payload) => {
  const results = await Promise.allSettled(
    exchanges.map((ex) =>
      axios.post(`${ex.baseUrl}/api/bets/cancel`, payload, {
        headers: {
          'X-Api-Key': ex.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      })
    )
  );

  return results.map((result, index) => {
    const ex = exchanges[index];
    if (result.status === 'fulfilled') {
      const apiSuccess =
        typeof result.value?.data?.success === 'boolean' ? result.value.data.success : true;
      return {
        exchangeKey: ex.key,
        success: apiSuccess,
        data: result.value.data,
      };
    }
    return {
      exchangeKey: ex.key,
      success: false,
      error: result.reason?.message || 'Unknown error',
      status: result.reason?.response?.status,
    };
  });
};

const settleMatchOddsAllExchanges = async ({ eventId, marketId, winnerSelectionId, marketName }) => {
  const marketType = toMarketType(marketName);

  const payload = {
    marketType,
    eventId: String(eventId),
    marketId: String(marketId),
    winnerSelectionId: String(winnerSelectionId),
  };

  return postSettleToAllExchanges(payload);
};

const settleTosMarketAllExchanges = async ({ eventId, marketId, winnerSelectionId }) => {
  const payload = {
    marketType: 'tos_market',
    eventId: String(eventId),
    marketId: String(marketId),
    winnerSelectionId: String(winnerSelectionId),
  };

  return postSettleToAllExchanges(payload);
};

const settleBookmakerFancyAllExchanges = async ({ eventId, marketId, winnerSelectionId }) => {
  const payload = {
    marketType: 'bookmakers_fancy',
    eventId: String(eventId),
    marketId: String(marketId),
    winnerSelectionId: String(winnerSelectionId),
  };
  return postSettleToAllExchanges(payload);
};

const settleFancyAllExchanges = async ({ eventId, marketId, selectionId, finalValue }) => {
  const payload = {
    marketType: 'fancy',
    eventId: String(eventId),
    marketId: String(marketId),
    selectionId: String(selectionId),
    finalValue: Number(finalValue),
  };

  return postSettleToAllExchanges(payload);
};

const cancelMarketAllExchanges = async ({ marketType, eventId, marketId, selectionId, reason }) => {
  const payload = {
    marketType: String(marketType),
    eventId: String(eventId),
    marketId: String(marketId),
    reason: String(reason),
    ...(selectionId != null && selectionId !== '' ? { selectionId: String(selectionId) } : {}),
  };

  return postCancelToAllExchanges(payload);
};

module.exports = {
  settleMatchOddsAllExchanges,
  settleTosMarketAllExchanges,
  settleBookmakerFancyAllExchanges,
  settleFancyAllExchanges,
  cancelMarketAllExchanges,
};

