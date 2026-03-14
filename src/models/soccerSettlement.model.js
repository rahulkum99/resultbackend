const mongoose = require('mongoose');

const soccerSettlementSchema = new mongoose.Schema(
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

soccerSettlementSchema.index(
  { eventId: 1, marketId: 1 },
  { unique: true }
);

const SoccerSettlement = mongoose.model('SoccerSettlement', soccerSettlementSchema);

module.exports = SoccerSettlement;
