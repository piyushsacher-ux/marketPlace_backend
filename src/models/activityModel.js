const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["LOGIN", "VIEW_INVENTORY", "PURCHASE"],
      required: true,
    },
    date:{
      type: Date,
      required: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {timestamps: true}
);

module.exports = mongoose.model("Activity", activitySchema);
