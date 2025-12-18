const User=require("../models/userModel")
const Error=require("../utils/error")
const bcrypt=require("bcrypt");
const Session=require("../models/sessionModel")
const { generateOTP ,hashOTP} = require("../utils/otp");

exports.register = async (req, res) => {
  try {
    const { email, username, password, latitude, longitude } = req.body;

    if (!email || !username || !password || !latitude || !longitude) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser=await User.findOne({email});
    if(existingUser){
        return res.status(Error.USER_ALREADY_EXISTS.status_code).json({message:Error.USER_ALREADY_EXISTS.message});
    }

    const hashedPassword=await bcrypt.hash(password,10);

    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      isEmailVerified: false,
      isDeleted: false,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });
    const otp=generateOTP();
    const otpHash=await hashOTP(otp);

    await Session.create({
      userId: user._id,
      type: "VERIFY_EMAIL",
      otpHash,
      expiresAt: new Date(Date.now()+ 5 * 60 * 1000),
    });

    return res.status(201).json({
      message: "User registered successfully. Verify email using OTP.",
      otp
    });
  } catch (err) {
    console.error(err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json(Error.INTERNAL_SERVER);
  }
};
