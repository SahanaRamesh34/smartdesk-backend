const express = require("express");
const router = express.Router();
const Note = require("../models/Note");

// Test route
router.get("/test", (req, res) => {
  res.send("Notes API working");
});

// Create a new note
router.post("/save", async (req, res) => {
  try {
    const { userId, title, content, strokes, tags, subject, pageNumber } = req.body;
    const note = await Note.create({ userId, title, content, strokes, tags, subject, pageNumber });
    res.status(201).json({ message: "Note saved", note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all notes for a user
router.get("/:userId", async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.params.userId });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a note
router.put("/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json({ message: "Note updated", note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a note
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;