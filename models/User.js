const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ["student", "teacher", "admin"], default: "student" },
  regNo:    { type: String, unique: true, sparse: true },
  subjects: { type: [String], default: [] },
  streak:   { type: Number, default: 0 },
  studyTimeData: { type: mongoose.Schema.Types.Mixed, default: {} },
  weeklyStats: { type: mongoose.Schema.Types.Mixed, default: {} },
  events:   { type: [mongoose.Schema.Types.Mixed], default: [] },
  resources: { type: mongoose.Schema.Types.Mixed, default: {} },
  lastStudyDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);