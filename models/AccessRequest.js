const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema({
  requesterId: { type: String, required: true },
  requesterName: { type: String, required: true },
  ownerId: { type: String, required: true },
  resourceId: { type: String, required: true },
  resourceTitle: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("AccessRequest", accessRequestSchema);
