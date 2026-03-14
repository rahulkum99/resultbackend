const mongoose = require('mongoose');

const tennisSettlementSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    marketId: {
      type: String,
      required: true,
      index: true,
    },
    marketName: {
      type: String,
    },
    winnerSelectionId: {
      type: String,
    },
    winnerSelectionName: {
      type: String,
    },
    exchangeReport: [
      {
        exchangeKey: String,
        success: Boolean,
        data: mongoose.Schema.Types.Mixed,
        error: String,
        status: Number,
      },
    ],
    settledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

tennisSettlementSchema.index(
  { eventId: 1, marketId: 1 },
  { unique: true }
);

const TennisSettlement = mongoose.model('TennisSettlement', tennisSettlementSchema);

module.exports = TennisSettlement;
