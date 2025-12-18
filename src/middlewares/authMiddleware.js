const jwt = require("jsonwebtoken");
const Session = require("../models/sessionModel");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Not logged in" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const session = await Session.findOne({
      userId: payload.userId,
      type: "LOGIN",
      token,
    });

    if (!session) {
      return res.status(401).json({ message: "Session expired" });
    }

    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
