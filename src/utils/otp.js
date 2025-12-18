const crypto=require("crypto");
const bcrypt=require("bcrypt");

function generateOTP(){
    return crypto.randomInt(100000,1000000).toString();
}

async function hashOTP(otp){
    return await bcrypt.hash(otp,10);
}

async function compareOTP(otp,hash){
    return await bcrypt.compare(otp,hash);
}

module.exports={generateOTP,hashOTP,compareOTP};