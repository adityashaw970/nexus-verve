const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
  },
  round: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  set: {
    type: Number,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  }
}, { timestamps: true });

// Index for fast retrieval by round
questionSchema.index({ round: 1, order: 1 });

// Prevent OverwriteModelError on hot-reload
module.exports = mongoose.models.Question || mongoose.model("Question", questionSchema);