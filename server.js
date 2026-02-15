const express=require("express");
const cors=require("cors");
require("./db");

const app=express();

app.use(cors());
app.use(express.json());

app.use("/study",require("./routes/study"));
app.use("/notes",require("./routes/notes"));


app.listen(3000,()=>{
 console.log("Server running on port 3000");
});
