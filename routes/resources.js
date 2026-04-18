const express = require("express");
const Resource = require("../models/Resource");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
    }
});
const upload = multer({ storage });

// GET /resources?subject=XYZ
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { subject } = req.query;
        if (!subject) return res.status(400).json({ message: "Subject required" });
        const resources = await Resource.find({ subject });
        res.json(resources);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /resources
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can upload global resources" });
        }

        const { subject, type, title, url } = req.body;
        let dataStr = "";

        if (type === "links") {
            if (!url) return res.status(400).json({ message: "URL required for links" });
            dataStr = url;
        } else {
            if (!req.file) return res.status(400).json({ message: "File required" });
            dataStr = "http://localhost:3000/uploads/" + req.file.filename;
        }

        const newResource = new Resource({
            title,
            subject,
            type,
            data: dataStr,
            authorName: req.user.name,
            authorId: req.userId
        });

        await newResource.save();
        res.json({ message: "Resource uploaded successfully", resource: newResource });
    } catch (err) {
        console.error("--- BACKEND ERROR LOG ---");
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE /resources/:id
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can delete global resources" });
        }
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: "Resource not found" });

        // Check ownership (optional, but good practice)
        if (resource.authorId !== req.userId) {
            return res.status(403).json({ message: "You can only delete your own resources" });
        }

        await Resource.findByIdAndDelete(req.params.id);
        res.json({ message: "Resource deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;