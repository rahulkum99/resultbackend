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
      return {
        exchangeKey: ex.key,
        success: true,
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
    marketType: 'bookmaker_fancy',
    eventId: String(eventId),
    marketId: String(marketId),
    winnerSelectionId: String(winnerSelectionId),
  };
  return postSettleToAllExchanges(payload);
};

module.exports = {
  settleMatchOddsAllExchanges,
  settleTosMarketAllExchanges,
  settleBookmakerFancyAllExchanges,
};

