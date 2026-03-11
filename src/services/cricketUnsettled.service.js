const axios = require('axios');
const { fetchCricketEventData } = require('./cricketevent.service');
const CricketUnsettled = require('../models/cricketUnsettled.model');
const exchanges = require('../config/exchanges');

const fetchUnsettledCricketBets = async () => {
  try {
    const results = await Promise.allSettled(
      exchanges.map((ex) =>
        axios.get(`${ex.baseUrl}/api/bets/settlement/unsettled-bets?sport=cricket`, {
          headers: {
            'X-Api-Key': ex.apiKey,
          },
          timeout: 15000,
        })
      )
    );

    const all = [];

    results.forEach((result, index) => {
      const ex = exchanges[index];
      if (result.status === 'fulfilled') {
        const rows = result.value.data?.data?.cricket || [];
        rows.forEach((row) => {
          all.push({
            ...row,
            exchangeKey: ex.key,
            exchangeBaseUrl: ex.baseUrl,
          });
        });
      } else {
        const status = result.reason?.response?.status;
        console.error(`Cricket unsettled API error (${ex.key}):`, status || result.reason?.message);
      }
    });

    return all;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error('Cricket unsettled API error: Request timeout - API took longer than 15 seconds');
    } else if (error.response) {
      console.error('Cricket unsettled API error: Server responded with status', error.response.status);
    } else if (error.request) {
      console.error('Cricket unsettled API error: No response received from server');
    } else {
      console.error('Cricket unsettled API error:', error.message);
    }
    throw error;
  }
};

const enrichUnsettledWithSections = async () => {
  const unsettled = await fetchUnsettledCricketBets();

  if (!Array.isArray(unsettled) || unsettled.length === 0) {
    return [];
  }

  // Collect unique eventIds
  const eventIds = [...new Set(unsettled.map((bet) => bet.eventId).filter(Boolean))];

  // Fetch event data per eventId using existing cached service
  const eventsByEventId = {};

  await Promise.all(
    eventIds.map(async (eventId) => {
      try {
        const data = await fetchCricketEventData(eventId);
        eventsByEventId[eventId] = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error(`Failed to fetch cricket event data for eventId ${eventId}:`, error.message);
        eventsByEventId[eventId] = [];
      }
    })
  );

  // Attach sections (runner list) and inplay flag to each unsettled bet
  const enriched = unsettled.map((bet) => {
    const markets = eventsByEventId[bet.eventId] || [];
    const market = markets.find((m) => String(m.mid) === String(bet.marketId));

    const section = market
      ? (market.section || []).map((s) => ({
          sid: s.sid,
          nat: s.nat,
        }))
      : [];

    const inplay = market && typeof market.iplay !== 'undefined' ? Boolean(market.iplay) : null;

    return {
      ...bet,
      section,
      inplay,
    };
  });

  // Persist enriched records in Mongo (upsert by eventId+marketId+selectionId)
  const bulkOps = enriched.map((bet) => ({
    updateOne: {
      filter: {
        exchangeKey: String(bet.exchangeKey),
        eventId: String(bet.eventId),
        marketId: String(bet.marketId),
        selectionId: String(bet.selectionId),
      },
      update: {
        $set: {
          exchangeKey: String(bet.exchangeKey),
          exchangeBaseUrl: bet.exchangeBaseUrl,
          eventId: String(bet.eventId),
          eventName: bet.eventName,
          marketId: String(bet.marketId),
          marketName: bet.marketName,
          selectionId: String(bet.selectionId),
          selectionName: bet.selectionName,
          openBets: bet.openBets,
          totalStake: bet.totalStake,
          totalExposure: bet.totalExposure,
          section: bet.section,
          inplay: bet.inplay,
          lastSeenAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  try {
    if (bulkOps.length > 0) {
      await CricketUnsettled.bulkWrite(bulkOps, { ordered: false });
    }
  } catch (dbError) {
    console.error('Failed to persist enriched cricket unsettled data:', dbError.message);
  }

  return enriched;
};

module.exports = {
  fetchUnsettledCricketBets,
  enrichUnsettledWithSections,
};

