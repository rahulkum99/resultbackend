const mongoose = require('mongoose');

const soccerUnsettledSchema = new mongoose.Schema(
  {
    exchangeKey: {
      type: String,
      required: true,
      index: true,
    },
    exchangeBaseUrl: {
      type: String,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    eventName: {
      type: String,
    },
    marketId: {
      type: String,
      required: true,
      index: true,
    },
    marketName: {
      type: String,
    },
    selectionId: {
      type: String,
      required: true,
      index: true,
    },
    selectionName: {
      type: String,
    },
    openBets: {
      type: Number,
    },
    totalStake: {
      type: Number,
    },
    totalExposure: {
      type: Number,
    },
    inplay: {
      type: Boolean,
      default: null,
    },
    section: [
      {
        sid: String,
        nat: String,
      },
    ],
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

soccerUnsettledSchema.index(
  { exchangeKey: 1, eventId: 1, marketId: 1, selectionId: 1 },
  { unique: true }
);

const SoccerUnsettled = mongoose.model('SoccerUnsettled', soccerUnsettledSchema);

module.exports = SoccerUnsettled;

