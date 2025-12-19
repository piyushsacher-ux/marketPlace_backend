const express=require("express");
const app=express();
const path = require("path");
require("dotenv").config();
const connectDB=require("./config/database");
const seedAll = require("./seed/seed");
const authRoutes=require("./routes/authRouter")
const cookieParser = require("cookie-parser");
const userRoutes=require("./routes/userRouter")
const inventoryRoutes=require("./routes/inventoryRouter")
const purchaseRoutes=require("./routes/purchaseRouter")

const port=process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/inventory",inventoryRoutes)
app.use("/api/purchase",purchaseRoutes);

app.get("/", (req, res) => {
  res.send("Marketplace API is running");
});

connectDB().then(async()=>{
    console.log("DB connected")
    await seedAll();
    app.listen(port,()=>{
        console.log(`Server listening at port ${port}`)
    })
}).catch((err)=>{
    console.error("DB connection failed:", err.message);
})

