const mongoose = require('mongoose');

const soccerEventStateSchema = new mongoose.Schema(
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

const SoccerEventState = mongoose.model('SoccerEventState', soccerEventStateSchema);

module.exports = SoccerEventState;

