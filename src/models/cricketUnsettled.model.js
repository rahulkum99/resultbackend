const mongoose = require('mongoose');

const cricketUnsettledSchema = new mongoose.Schema(
  {
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

cricketUnsettledSchema.index(
  { exchangeKey: 1, eventId: 1, marketId: 1, selectionId: 1 },
  { unique: true }
);

const CricketUnsettled = mongoose.model('CricketUnsettled', cricketUnsettledSchema);

module.exports = CricketUnsettled;

