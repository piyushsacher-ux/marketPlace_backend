const Admin = require("../models/adminModel");
const Error=require("../utils/error")

const adminMiddleware = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.userId);
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    next();
  } catch (err) {
    console.error("Admin middleware error:", err);
    return res.status(Error.INTERNAL_SERVER.status_code).json({
      success: false,
      message: Error.INTERNAL_SERVER.message,
    });
  }
};

module.exports = adminMiddleware;
