const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});
const upload = multer({ storage: storage });


// GET PROFILE
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT PROFILE
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET ALL STUDENTS (Teacher only, though we can skip strict role check for simplicity or add it)
router.get("/students", authMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET SPECIFIC STUDENT
router.get("/student/:regNo", authMiddleware, async (req, res) => {
  try {
    const student = await User.findOne({ regNo: req.params.regNo, role: "student" }).select("-password");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST RESOURCE
router.post("/resource", authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { subject, type, title, url } = req.body;
    let resourceUrl = url;

    if (req.file) {
      resourceUrl = `http://localhost:${process.env.PORT || 3000}/uploads/${req.file.filename}`;
    }

    if (!resourceUrl) {
      return res.status(400).json({ message: "File or URL required" });
    }

    const user = await User.findById(req.userId);
    if (!user.resources) user.resources = {};
    if (!user.resources[subject]) user.resources[subject] = { notes: [], books: [], links: [] };
    if (!user.resources[subject][type]) user.resources[subject][type] = [];

    const newResource = { title, data: resourceUrl, id: Date.now() };
    
    // We must inform mongoose that the Mixed type was modified
    user.resources[subject][type].push(newResource);
    user.markModified('resources');
    
    await user.save();

    res.json({ message: "Resource added", resource: newResource, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// POST LOG STUDY TIME
router.post("/log-study", authMiddleware, async (req, res) => {
  try {
    const { subject, minutes } = req.body;
    if (!subject || !minutes) return res.status(400).json({ message: "Subject and minutes required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.studyTimeData) user.studyTimeData = {};
    if (!user.weeklyStats) user.weeklyStats = {};

    const hours = minutes / 60;
    
    user.studyTimeData[subject] = (user.studyTimeData[subject] || 0) + hours;

    const dayNames = ['Day 7', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];
    const currentDay = dayNames[new Date().getDay()];
    
    user.weeklyStats[currentDay] = (user.weeklyStats[currentDay] || 0) + hours;

    // Streak Logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!user.lastStudyDate) {
        user.streak = 1;
        user.lastStudyDate = today;
    } else {
        const lastDate = new Date(user.lastStudyDate);
        lastDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            user.streak += 1;
            user.lastStudyDate = today;
        } else if (diffDays > 1) {
            user.streak = 1;
            user.lastStudyDate = today;
        }
    }

    user.markModified('studyTimeData');
    user.markModified('weeklyStats');
    await user.save();

    res.json({ message: "Study time logged", streak: user.streak, studyTimeData: user.studyTimeData, weeklyStats: user.weeklyStats });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE PRIVATE RESOURCE
router.delete("/resource/:subject/:type/:id", authMiddleware, async (req, res) => {
  try {
    const { subject, type, id } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resources && user.resources[subject] && user.resources[subject][type]) {
      user.resources[subject][type] = user.resources[subject][type].filter(r => r.id.toString() !== id);
      user.markModified('resources');
      await user.save();
      res.json({ message: "Resource deleted", user });
    } else {
      res.status(404).json({ message: "Resource not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;