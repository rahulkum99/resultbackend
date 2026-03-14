const mongoose = require('mongoose');

const cricketEventStateSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CricketEventState = mongoose.model('CricketEventState', cricketEventStateSchema);

module.exports = CricketEventState;

