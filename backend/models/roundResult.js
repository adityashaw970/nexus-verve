const mongoose = require("mongoose");

const roundResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  round: {
    type: Number,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  attemptedQuestions: {
    type: [Number],
    default: [],
  },
}, { timestamps: true });

// Compound index for user+round uniqueness and fast queries
roundResultSchema.index({ userId: 1, round: 1 }, { unique: true });
roundResultSchema.index({ round: 1, score: -1 }); // For leaderboards

module.exports = mongoose.models.roundResult || mongoose.model("roundResult", roundResultSchema);