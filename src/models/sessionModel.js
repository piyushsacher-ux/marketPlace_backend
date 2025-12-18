const mongoose = require("mongoose");

const sessionSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
        index:true,
    },
    type:{
        type:String,
        enum:["VERIFY_EMAIL","LOGIN","FORGOT_PASSWORD"],
        required:true,
    },
    token:{
        type:String,
        required:true,
        index:true,
    },
    expiresAt:{
        type:Date,
        required:true,
        index:{expires:0}
    }
},{timestamps:true});

module.exports=mongoose.model("Session",sessionSchema);