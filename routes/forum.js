const express = require("express");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET posts for a specific subject
router.get("/", authMiddleware, async (req, res) => {
    try {
        const { subject } = req.query;
        if (!subject) return res.status(400).json({ message: "Subject required" });
        const posts = await Post.find({ subject }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// POST a new thread
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { subject, title, body } = req.body;
        if (!subject || !title || !body) return res.status(400).json({ message: "Missing required fields" });

        const post = new Post({
            subject,
            title,
            body,
            authorName: req.user.name,
            authorRole: req.user.role
        });
        await post.save();
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// POST a reply to a thread
router.post("/:id/reply", authMiddleware, async (req, res) => {
    try {
        const { body } = req.body;
        if (!body) return res.status(400).json({ message: "Reply body required" });

        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        post.replies.push({
            authorName: req.user.name,
            authorRole: req.user.role,
            body
        });
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
