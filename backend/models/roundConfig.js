const mongoose = require("mongoose");

const roundConfigSchema = new mongoose.Schema({
  round: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  scoreMultiplier: {
    type: Number,
    required: true,
    default: 1,
  },
  questionTime: {
    type: Number,
    required: true, // in milliseconds
  },
  startTime: {
    type: String,
    required: true, // cron format
  },
  totalQuestions: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

// Prevent OverwriteModelError on hot-reload
module.exports = mongoose.models.RoundConfig || mongoose.model("RoundConfig", roundConfigSchema);