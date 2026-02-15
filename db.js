const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://smartdesk:<password>@cluster1.tepzcmk.mongodb.net/smartdesk");

mongoose.connection.on("connected",()=>{
 console.log("MongoDB connected");
});

mongoose.connection.on("error",(err)=>{
 console.log("MongoDB error:",err);
});

module.exports = mongoose;
