const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    unique: true,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  totalAttemptedQuestions: {
    type: Number,
    default: 0,
  },
  roundsCompleted: {
    type: [Number],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

quizResultSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ Prevent OverwriteModelError on hot-reload
module.exports = mongoose.models.quizResult || mongoose.model("quizResult", quizResultSchema);
