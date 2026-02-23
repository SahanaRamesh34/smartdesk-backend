const express = require("express");
const cors = require("cors");
require("dotenv").config();   // Load environment variables
const connectDB = require("./config/db");
connectDB();              // Keep existing DB connection

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Role 1 Routes (Auth & User)
app.use("/auth", require("./routes/auth"));
app.use("/user", require("./routes/user"));

// Role 3 Routes (Already Existing)
app.use("/study", require("./routes/study"));
app.use("/notes", require("./routes/notes"));

// Test Route
app.get("/", (req, res) => {
  res.send("SmartDesk API Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});