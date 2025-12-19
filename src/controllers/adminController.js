const User = require("../models/userModel");
const Activity = require("../models/activityModel");
const mongoose = require("mongoose");
const Error = require("../utils/error");

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
