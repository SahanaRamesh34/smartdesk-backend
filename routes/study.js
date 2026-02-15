const router=require("express").Router();
const mongoose=require("mongoose");

const Session = mongoose.model(
 "Session",
 new mongoose.Schema({
   start:Date,
   end:Date,
   duration:Number
 })
);

// Start study
router.post("/start", async(req,res)=>{
 const s = new Session({ start:new Date() });
 await s.save();
 res.json({message:"Session started"});
});

// End study
router.post("/end", async(req,res)=>{
 const last = await Session.findOne().sort({_id:-1});
if(!last){
   return res.json({message:"No session found"});
 }


 last.end = new Date();
 last.duration = (last.end - last.start)/1000;

 await last.save();

 res.json({message:"Session ended", duration:last.duration});
});
router.get("/test",(req,res)=>{
 res.send("Study API working");
});


module.exports=router;
