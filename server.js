const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();   // Load environment variables
const connectDB = require("./config/db");
connectDB();              // Keep existing DB connection

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "frontend")));

// Role 1 Routes (Auth & User)
app.use("/auth", require("./routes/auth"));
app.use("/user", require("./routes/user"));
app.use("/announcements", require("./routes/announcements"));
app.use("/resources", require("./routes/resources"));
app.use("/forum", require("./routes/forum"));

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
// Add this to the bottom of server.js
app.use((err, req, res, next) => {
    console.error("!!! GLOBAL ERROR CAUGHT !!!");
    console.error(err.stack);
    res.status(500).send({ message: err.message });
});