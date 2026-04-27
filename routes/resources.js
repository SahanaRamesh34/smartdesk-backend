const express = require("express");
const Resource = require("../models/Resource");
const User = require("../models/User");
const AccessRequest = require("../models/AccessRequest");
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
        // 1. MUST be a teacher
        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "Only teachers can delete faculty materials" });
        }

        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: "Resource not found" });

        // 2. MUST be the owner
        if (resource.authorId.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized: You can only delete your own resources" });
        }

        await Resource.findByIdAndDelete(req.params.id);
        res.json({ message: "Resource deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /resources/search?q=...
router.get("/search", authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: "Search query required" });
        
        const escapedQ = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regex = new RegExp(escapedQ, 'i');
        let results = [];

        // 1. Search public faculty materials
        const publicResources = await Resource.find({ title: regex });
        publicResources.forEach(r => {
            results.push({
                id: r._id,
                title: r.title,
                authorName: r.authorName,
                subject: r.subject,
                type: 'global',
                url: r.data,
                ownerId: r.authorId
            });
        });

        // 2. Search private student materials
        const allUsers = await User.find({ role: "student" }).select("name _id resources");
        
        // 3. Get approved requests for current user to show URLs
        const approvedRequests = await AccessRequest.find({ requesterId: req.userId, status: "approved" });
        const approvedResourceIds = approvedRequests.map(ar => ar.resourceId);

        allUsers.forEach(user => {
            if (user.resources) {
                Object.keys(user.resources).forEach(subject => {
                    const subjRes = user.resources[subject];
                    ["notes", "books", "links"].forEach(rType => {
                        if (subjRes[rType]) {
                            subjRes[rType].forEach(r => {
                                if (regex.test(r.title)) {
                                    const isOwner = user._id.toString() === req.userId;
                                    const rIdStr = r.id ? r.id.toString() : r._id ? r._id.toString() : "unknown";
                                    const hasAccess = approvedResourceIds.includes(rIdStr);
                                    
                                    results.push({
                                        id: rIdStr,
                                        title: r.title,
                                        authorName: user.name,
                                        subject: subject,
                                        type: 'private',
                                        url: (isOwner || hasAccess) ? r.data : null,
                                        ownerId: user._id.toString(),
                                        isOwner: isOwner,
                                        hasAccess: hasAccess
                                    });
                                }
                            });
                        }
                    });
                });
            }
        });

        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /resources/request-access
router.post("/request-access", authMiddleware, async (req, res) => {
    try {
        const { ownerId, resourceId, resourceTitle } = req.body;
        if (!ownerId || !resourceId) return res.status(400).json({ message: "ownerId and resourceId required" });

        // Check if a request already exists
        const existing = await AccessRequest.findOne({ requesterId: req.userId, resourceId: resourceId });
        if (existing) return res.status(400).json({ message: "Request already exists", status: existing.status });

        const reqUser = await User.findById(req.userId);

        const newRequest = new AccessRequest({
            requesterId: req.userId,
            requesterName: reqUser.name,
            ownerId,
            resourceId,
            resourceTitle
        });

        await newRequest.save();
        res.json({ message: "Access request sent successfully", request: newRequest });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /resources/access-requests
router.get("/access-requests", authMiddleware, async (req, res) => {
    try {
        // Find requests where the current user is the owner (incoming)
        const incoming = await AccessRequest.find({ ownerId: req.userId });
        
        // Find requests where the current user is the requester (outgoing)
        const outgoing = await AccessRequest.find({ requesterId: req.userId });

        res.json({ incoming, outgoing });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /resources/access-requests/:id
router.put("/access-requests/:id", authMiddleware, async (req, res) => {
    try {
        const { status } = req.body; // 'approved' or 'denied'
        if (!["approved", "denied"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const accessReq = await AccessRequest.findById(req.params.id);
        if (!accessReq) return res.status(404).json({ message: "Request not found" });

        if (accessReq.ownerId.toString() !== req.userId) {
            return res.status(403).json({ message: "Unauthorized to modify this request" });
        }

        accessReq.status = status;
        await accessReq.save();

        res.json({ message: `Request ${status}`, request: accessReq });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;