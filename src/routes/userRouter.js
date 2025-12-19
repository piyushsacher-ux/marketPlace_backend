const express = require("express");
const router = express.Router();
const { getNearbyUsersPublic,getNearbyUsersAuth } = require("../controllers/userController");
const auth=require("../middlewares/authMiddleware")

router.get("/nearby", getNearbyUsersPublic);
router.get("/nearby-auth", auth, getNearbyUsersAuth);

module.exports = router;
