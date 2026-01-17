const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    unique: true,
    index: true
  },
  totalScore: {
    type: Number,
    default: 0,
    index: true
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

module.exports = mongoose.models.quizResult || mongoose.model("quizResult", quizResultSchema);