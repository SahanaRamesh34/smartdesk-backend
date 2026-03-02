const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:      { type: String, default: "Untitled" },
  content:    { type: String },
  strokes:    { type: Array },
  tags:       [String],
  subject:    { type: String },
  pageNumber: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model("Note", noteSchema);