const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

inventorySchema.post("save", function (doc) {
  console.log("Inventory Created");
  console.log(doc);
});

inventorySchema.pre("findOneAndUpdate", async function (next) {
  this._oldDoc = await this.model.findOne(this.getQuery());
});

inventorySchema.post("findOneAndUpdate", function (doc) {
  console.log("Inventory Updated");
  console.log("Before:", this._oldDoc);
  console.log("After:", doc);
});

module.exports = inventorySchema;
