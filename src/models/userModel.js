const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        required: true,
        default: "Point",
      },
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("User", userSchema);