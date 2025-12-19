const Error = require("../utils/error");
const Transaction = require("../models/transactionModel");
const getUserDb = require("../utils/getUserDb");
const inventorySchema = require("../models/inventorySchema");
const Activity = require("../models/activityModel");

exports.purchaseItem = async (req, res) => {
  try {
    const buyerId = req.userId;
    const { sellerId, itemId, quantity } = req.body;

    if (!sellerId || !itemId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    if (buyerId.toString() === sellerId.toString()) {
      return res.status(400).json({ message: "Cannot buy your own item" });
    }

    const conn = await getUserDb(sellerId);
    const Inventory = conn.model("Inventory", inventorySchema);

    const item = await Inventory.findOne({
      _id: itemId,
      isDeleted: false,
    });

    if (!item) {
      await conn.close();
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.quantity < quantity) {
      await conn.close();
      return res.status(400).json({ message: "Insufficient stock" });
    }

    item.quantity -= quantity;
    await item.save();

    await conn.close();

    await Transaction.create({
      buyerId,
      sellerId,
      productName: item.productName,
      quantity,
      price: item.price,
      totalAmount: item.price * quantity,
      isDeleted: false,
    });

    await Activity.create({
      userId: buyerId,
      action: "PURCHASE",
      date: new Date(),
    });

    return res.status(200).json({
      message: "Purchase successful",
    });
  } catch (err) {
    console.error(err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json({ message: Error.INTERNAL_SERVER.message });
  }
};
