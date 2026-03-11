const axios = require('axios');
const CricketEventNegativeCache = require('../models/cricketEventNegativeCache.model');

const API_URL = process.env.CRICKET_EVENT_API_URL;

// Store data per event ID
const eventDataCache = new Map();
// Track fetching state per event ID
const fetchingStates = new Map();

const fetchCricketEventData = async (eventId) => {
  if (!eventId) {
    console.error('Cricket event API error: eventId is required');
    return null;
  }

  // If we previously recorded this event as "not found" in DB, skip external call
  try {
    const negative = await CricketEventNegativeCache.findOne({ eventId }).lean();
    if (negative) {
      return null;
    }
  } catch (dbError) {
    console.error(`Cricket event negative cache DB error (eventId: ${eventId}):`, dbError.message);
  }

  // If a request for this event is already in progress, skip this call
  if (fetchingStates.get(eventId)) {
    return eventDataCache.get(eventId) || null;
  }

  fetchingStates.set(eventId, true);

  try {
    const response = await axios.get(`${API_URL}?eventId=${eventId}`, {
      timeout: 15000, // Increased to 15 seconds
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const apiResponse = response.data;

    // If API explicitly says "not found", store negative cache and return null
    if (apiResponse && apiResponse.success === false) {
      try {
        await CricketEventNegativeCache.findOneAndUpdate(
          { eventId },
          {
            eventId,
            msg: apiResponse.msg || 'Not found',
            lastCheckedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      } catch (dbError) {
        console.error(`Failed to upsert cricket event negative cache (eventId: ${eventId}):`, dbError.message);
      }
      return null;
    }

    // Successful response: clear any negative cache and store positive data
    try {
      await CricketEventNegativeCache.deleteOne({ eventId });
    } catch (dbError) {
      console.error(`Failed to clear cricket event negative cache (eventId: ${eventId}):`, dbError.message);
    }

    // Extract only the data array from API response { success, msg, status, data }
    const data = apiResponse?.data || apiResponse;
    eventDataCache.set(eventId, data);
    return data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.error(`Cricket event API error (eventId: ${eventId}): Request timeout - API took longer than 15 seconds`);
    } else if (error.response) {
      console.error(`Cricket event API error (eventId: ${eventId}): Server responded with status`, error.response.status);
    } else if (error.request) {
      console.error(`Cricket event API error (eventId: ${eventId}): No response received from server`);
    } else {
      console.error(`Cricket event API error (eventId: ${eventId}):`, error.message);
    }
    // Return cached data if available for this event
    return eventDataCache.get(eventId) || null;
  } finally {
    fetchingStates.set(eventId, false); // Reset flag when request completes
  }
};

const getLatestCricketEventData = (eventId = null) => {
  if (eventId) {
    return eventDataCache.get(eventId) || null;
  }
  // If no eventId specified, return all cached data (for backward compatibility)
  const allData = Array.from(eventDataCache.values());
  return allData.length > 0 ? allData.flat() : null;
};

module.exports = {
  fetchCricketEventData,
  getLatestCricketEventData,
};
