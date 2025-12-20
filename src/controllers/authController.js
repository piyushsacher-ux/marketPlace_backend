const User = require("../models/userModel");
const Error = require("../utils/error");
const bcrypt = require("bcrypt");
const Session = require("../models/sessionModel");
const { generateOTP, hashOTP, compareOTP } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/mailer");
const jwt = require("jsonwebtoken");
const Activity = require("../models/activityModel");
const Admin = require("../models/adminModel");

exports.register = async (req, res) => {
  try {
    const { email, username, password, latitude, longitude } = req.body;

    if (!email || !username || !password || !latitude || !longitude) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const activeUser = await User.findOne({
      email,
      isDeleted: false,
    });

    if (activeUser) {
      return res
        .status(Error.USER_ALREADY_EXISTS.status_code)
        .json({ message: Error.USER_ALREADY_EXISTS.message });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    await Session.deleteMany({
      userId: user._id,
      type: "VERIFY_EMAIL",
    });

    await Session.create({
      userId: user._id,
      type: "VERIFY_EMAIL",
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const verifyToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });

    res.cookie("verify_token", verifyToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 5 * 60 * 1000,
    });

    await sendOtpEmail({
      to: user.email,
      name: user.username,
      otp,
    });

    return res.status(201).json({
      message: "User registered successfully. Verify email using OTP.",
      otp,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json(Error.INTERNAL_SERVER);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const {otp} = req.body;
    const token = req.cookies.verify_token;
    if (!otp) {
      return res.status(Error.BAD_REQUEST.status_code).json(Error.BAD_REQUEST);
    }
    if (!token) {
      return res.status(401).json({ message: "Verification token expired" });
    }

    const payload=jwt.verify(token,process.env.JWT_SECRET);
    if(!payload) return res.status(401).json({ message: "Invalid or expired token" });

    const {userId}=payload;
  
    const user = await User.findOne({_id:userId,isDeleted:false});
    if (!user ) {
      return res.status(Error.NOT_FOUND.status_code).json(Error.NOT_FOUND);
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const session = await Session.findOne({
      userId,
      type: "VERIFY_EMAIL",
    });

    if (!session) {
      return res.status(Error.UNAUTHORISED.status_code).json({
        message: "OTP expired or invalid",
      });
    }

    const isValid = await compareOTP(otp, session.otpHash);
    if (!isValid) {
      return res.status(Error.UNAUTHORISED.status_code).json({
        message: "Invalid OTP",
      });
    }

    user.isEmailVerified = true;
    await user.save();
    await Session.deleteOne({ _id: session._id });
    res.clearCookie("verify_token");

    return res.json({
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json({message:Error.INTERNAL_SERVER});
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    let account = await User.findOne({ email, isDeleted: false });
    let role = "USER";

    if (!account) {
      account = await Admin.findOne({ email });
      role = "ADMIN";
    }

    if (!account) {
      return res
        .status(Error.INVALID_CREDENTIALS.status_code)
        .json({ message: Error.INVALID_CREDENTIALS.message });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res
        .status(Error.INVALID_CREDENTIALS.status_code)
        .json({ message: Error.INVALID_CREDENTIALS.message });
    }

    if (role === "USER" && !account.isEmailVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    const token = jwt.sign(
      { userId: account._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await Session.create({
      userId: account._id,
      type: "LOGIN",
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await Activity.create({
      userId: account._id,
      action: "LOGIN",
      date: new Date(),
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      role,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json({ message: Error.INTERNAL_SERVER.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(Error.BAD_REQUEST.status_code)
        .json({ message: "Email is required" });
    }

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res
        .status(Error.NOT_FOUND.status_code)
        .json({ message: "User not found" });
    }

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);

    await Session.deleteMany({
      userId: user._id,
      type: "FORGOT_PASSWORD",
    });

    await Session.create({
      userId: user._id,
      type: "FORGOT_PASSWORD",
      otpHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    res.cookie("reset_token", resetToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 30 * 60 * 1000,
    });

    await sendOtpEmail({
      to: user.email,
      name: user.username,
      otp,
    });

    return res.json({
      message: "OTP sent to registered email",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json({ message: Error.INTERNAL_SERVER.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const token = req.cookies.reset_token;

    if (!otp || !newPassword) {
      return res
        .status(Error.BAD_REQUEST.status_code)
        .json({ message: "OTP and new password are required" });
    }

    if (!token) {
      return res
        .status(Error.UNAUTHORISED.status_code)
        .json({ message: "Reset token missing or expired" });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(Error.UNAUTHORISED.status_code)
        .json({ message: "Invalid or expired reset token" });
    }

    const { userId } = payload;

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res
        .status(Error.NOT_FOUND.status_code)
        .json({ message: "User not found" });
    }

    const session = await Session.findOne({
      userId,
      type: "FORGOT_PASSWORD",
    });

    if (!session) {
      return res
        .status(Error.BAD_REQUEST.status_code)
        .json({ message: "OTP expired or invalid" });
    }

    const isValidOtp = await bcrypt.compare(otp, session.otpHash);
    if (!isValidOtp) {
      return res
        .status(Error.BAD_REQUEST.status_code)
        .json({ message: "Invalid OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await Session.deleteOne({ _id: session._id });
    res.clearCookie("reset_token");

    return res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json({ message: Error.INTERNAL_SERVER.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(400).json({
        message: "Already logged out",
      });
    }

    await Session.deleteOne({
      token,
      type: "LOGIN",
    });
    res.clearCookie("token");

    return res.json({
      message: "Logout successful",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
