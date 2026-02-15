const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/test",(req,res)=>{
 res.send("Notes API working");
});


const Note = mongoose.model("Note",
 new mongoose.Schema({
   text:String,
   created:Date
 })
);

router.post("/save", async(req,res)=>{
 const note = new Note({
   text:req.body.text,
   created:new Date()
 });

 await note.save();
 res.json({message:"Note saved"});
});


module.exports = router;
