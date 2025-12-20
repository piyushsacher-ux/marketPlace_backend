const User = require("../models/userModel");
const Activity = require("../models/activityModel");
const mongoose = require("mongoose");
const Error = require("../utils/error");
const inventorySchema = require("../models/inventorySchema")
exports.getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const totalUsers = await User.countDocuments({ isDeleted: false });

    const newUsersLast24h = await User.countDocuments({
      isDeleted: false,
      createdAt: { $gte: last24h },
    });

    //ye model.distinct ek array return krega
    const activeUsers = await Activity.distinct("userId", {
      createdAt: { $gte: last7d },
      isDeleted: false,
    });

    //Total unique products (across all user DBs)
    const users = await User.find({ isDeleted: false }).select("_id");
    const uniqueProducts = new Set();

    for (const user of users) {
      const dbName = `marketplace_user_${user._id}`;
      const conn = await mongoose.createConnection(
        `${process.env.CONNECTION_STRING}/${dbName}`
      );

      const products = await conn
        .collection("inventories")
        .distinct("productName", { isDeleted: false });

      products.forEach((p) => uniqueProducts.add(p));
      await conn.close();
    }

    return res.json({
      totalUsers,
      activeUsersLast7Days: activeUsers.length,
      newUsersLast24h,
      totalUniqueProducts: uniqueProducts.size,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json({ message: Error.INTERNAL_SERVER.message });
  }
};

exports.userAcquisitionGraph = async (req, res) => {
  try {
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const data = await User.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: last7d },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    res.json(data);
  } catch (err) {
    console.error("Admin stats error:", err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json({ message: Error.INTERNAL_SERVER.message });
  }
};

exports.userActivityGraph = async (req, res) => {
  try {
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const data = await Activity.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: last7d },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          users: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          _id: 1,
          activeUsers: { $size: "$users" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json(data);

  } catch (err) {
    console.error("error:", err);
    return res
      .status(Error.INTERNAL_SERVER.status_code)
      .json({ message: Error.INTERNAL_SERVER.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ isDeleted: false })
      .select("_id email username createdAt")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ isDeleted: false });

    res.json({
      page,
      limit,
      total,
      users,
    });
  } catch (err) {
    res.status(Error.INTERNAL_SERVER.status_code).json({ message: Error.INTERNAL_SERVER.message });
  }
};

exports.getUserInventory = async (req, res) => {
  const { userId } = req.params;

  try {

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const dbName = `marketplace_user_${userId}`;
    const conn = await mongoose.createConnection(
      `${process.env.CONNECTION_STRING}/${dbName}`
    );

    const Inventory = conn.model("Inventory", inventorySchema);

    const items = await Inventory.find({ isDeleted: false }).select("productName price quantity")

    await conn.close();

    res.json({ userId, items });
  } catch (err) {
    res.status(Error.INTERNAL_SERVER.status_code).json({message: Error.INTERNAL_SERVER.message});
  }
};

exports.updateUserInventoryItem = async (req, res) => {
  const { userId, itemId } = req.params;
  const update = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }

    const allowedUpdates = {};
    if (update.price !== undefined) allowedUpdates.price = update.price;
    if (update.quantity !== undefined) allowedUpdates.quantity = update.quantity;
    if (update.productName !== undefined) allowedUpdates.productName = update.productName;

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const dbName = `marketplace_user_${userId}`;
    const conn = await mongoose.createConnection(
      `${process.env.CONNECTION_STRING}/${dbName}`
    );
  
    const Inventory = conn.model("Inventory", inventorySchema);

    const item = await Inventory.findOneAndUpdate(
      { _id: itemId, isDeleted: false },
      allowedUpdates,
      { new: true ,runValidators: true }
    ).select("productName price quantity")

    await conn.close();

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item updated", item });
  } catch (err) {
    res.status(Error.INTERNAL_SERVER.status_code).json({message: Error.INTERNAL_SERVER.message});
  }
};


exports.deleteUserInventoryItem = async (req, res) => {
  const { userId, itemId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await User.findOne({ _id: userId, isDeleted: false });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid itemId" });
    }
    const dbName = `marketplace_user_${userId}`;
    const conn = await mongoose.createConnection(
      `${process.env.CONNECTION_STRING}/${dbName}`
    );

    const Inventory = conn.model("Inventory", inventorySchema);

    const item = await Inventory.findOneAndUpdate(
      { _id: itemId },
      { isDeleted: true },
      { new: true }
    ).select("productName price quantity isDeleted")

    await conn.close();

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item deleted (soft)", item });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete item" });
  }
};


