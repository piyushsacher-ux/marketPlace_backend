const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    // ID of the user OR admin who owns this session
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["VERIFY_EMAIL", "LOGIN", "FORGOT_PASSWORD"],
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
    },
    token: {
      type: String,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
