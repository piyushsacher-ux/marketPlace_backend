const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");

const {getAdminStats,userAcquisitionGraph,userActivityGraph} = require("../controllers/adminController");

router.get("/stats", auth, admin, getAdminStats);
// router.get("/graphs/users", auth, admin, userAcquisitionGraph);
// router.get("/graphs/activity", auth, admin, userActivityGraph);

module.exports = router;
