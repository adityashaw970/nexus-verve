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

// ✅ Add unique compound index (to prevent duplicate rounds per user)
roundResultSchema.index({ userId: 1, round: 1 }, { unique: true });

// ✅ Prevent OverwriteModelError on hot-reload
module.exports = mongoose.models.roundResult || mongoose.model("roundResult", roundResultSchema);
