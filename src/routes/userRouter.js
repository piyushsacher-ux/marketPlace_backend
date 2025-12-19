const express = require("express");
const router = express.Router();
const { getNearbyUsersPublic,getNearbyUsersAuth,updateLocation} = require("../controllers/userController");
const auth=require("../middlewares/authMiddleware")

router.get("/nearby", getNearbyUsersPublic);
router.get("/nearby-auth", auth, getNearbyUsersAuth);
router.patch("/location", auth, updateLocation);

module.exports = router;
