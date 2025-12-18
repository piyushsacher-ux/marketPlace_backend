const express=require("express");
const app=express();
require("dotenv").config();
const connectDB=require("./config/database");
const seedAll = require("./seed/seed");

const port=process.env.PORT || 3000;

connectDB().then(async()=>{
    console.log("DB connected")
    await seedAll();
    app.listen(port,()=>{
        console.log(`Server listening at port ${port}`)
    })
}).catch((err)=>{
    console.error("DB connection failed:", err.message);
})

