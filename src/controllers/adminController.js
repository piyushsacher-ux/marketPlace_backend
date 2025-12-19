const User = require("../models/userModel");
const Activity = require("../models/activityModel"); // if you created this
const mongoose = require("mongoose");

exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // 1️⃣ Total users
    const totalUsers = await User.countDocuments({ isDeleted: false });

    // 2️⃣ New users in last 24 hrs
    const newUsersLast24h = await User.countDocuments({
      isDeleted: false,
      createdAt: { $gte: last24h },
    });

    // 3️⃣ Active users (last 7 days)
    const activeUsers = await Activity.distinct("userId", {
      createdAt: { $gte: last7d },
    });

    // 4️⃣ Total unique products (across all user DBs)
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

      products.forEach(p => uniqueProducts.add(p));
      await conn.close();
    }

    return res.json({
      totalUsers,
      activeUsersLast7Days: activeUsers.length,
      newUsersLast24h,
      totalUniqueProducts: uniqueProducts.size,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
