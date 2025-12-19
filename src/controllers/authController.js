const User = require("../models/userModel");
const Error = require("../utils/error");
const bcrypt = require("bcrypt");
const Session = require("../models/sessionModel");
const { generateOTP, hashOTP, compareOTP } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/mailer");
const jwt = require("jsonwebtoken");
const Activity = require("../models/activityModel");
const Admin=require("../models/adminModel")

exports.register = async (req, res) => {
  try {
    const { email, username, password, latitude, longitude } = req.body;

    if (!email || !username || !password || !latitude || !longitude) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isDeleted) {
        return res.status(Error.FORBIDDEN.status_code).json({
          ...Error.FORBIDDEN,
          message: "Account with this email has been deactivated",
        });
      }
      if (existingUser.isEmailVerified) {
        return res
          .status(Error.USER_ALREADY_EXISTS.status_code)
          .json(Error.USER_ALREADY_EXISTS);
      }

      const otpSession = await Session.findOne({
        userId: existingUser._id,
        type: "VERIFY_EMAIL",
      });

      if (otpSession) {
        return res.status(400).json({
          message: "OTP already sent. Please verify your email.",
        });
      }

      await User.deleteOne({ _id: existingUser._id });
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

    await Session.create({
      userId: user._id,
      type: "VERIFY_EMAIL",
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
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
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(Error.BAD_REQUEST.status_code).json(Error.BAD_REQUEST);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(Error.NOT_FOUND.status_code).json(Error.NOT_FOUND);
    }

    const session = await Session.findOne({
      userId: user._id,
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
    return res.json({
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json(Error.INTERNAL_SERVER);
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
