const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  authorRole: { type: String, required: true },
  body: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  subject: { type: String, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, required: true },
  replies: { type: [replySchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
