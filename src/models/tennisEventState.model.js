const mongoose = require('mongoose');

const tennisEventStateSchema = new mongoose.Schema(
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

const TennisEventState = mongoose.model('TennisEventState', tennisEventStateSchema);

module.exports = TennisEventState;

