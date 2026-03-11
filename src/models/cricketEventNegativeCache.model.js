const mongoose = require('mongoose');

const cricketEventNegativeCacheSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    msg: {
      type: String,
    },
    lastCheckedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CricketEventNegativeCache = mongoose.model(
  'CricketEventNegativeCache',
  cricketEventNegativeCacheSchema
);

module.exports = CricketEventNegativeCache;

