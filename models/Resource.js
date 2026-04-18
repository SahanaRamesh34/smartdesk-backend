const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  type: { type: String, required: true }, // 'notes', 'books', 'links'
  data: { type: String, required: true }, // File path or URL
  authorName: { type: String, required: true },
  authorId: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Resource", resourceSchema);
