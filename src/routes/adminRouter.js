const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const admin = require("../middlewares/adminMiddleware");
const {getAdminStats,userAcquisitionGraph,userActivityGraph,listUsers,getUserInventory,updateUserInventoryItem,deleteUserInventoryItem} = require("../controllers/adminController");

router.get("/stats", auth, admin, getAdminStats);
router.get("/graphs/users", auth, admin, userAcquisitionGraph);
router.get("/graphs/activity", auth, admin, userActivityGraph);
router.get("/listUsers", auth, admin, listUsers);
router.get("/getUserInventory/:userId/inventory", auth, admin, getUserInventory);
router.patch("/updateUserInventoryItem/:userId/inventory/:itemId", auth, admin, updateUserInventoryItem);
router.delete("/deleteUserInventoryItem/:userId/inventory/:itemId", auth, admin, deleteUserInventoryItem);





module.exports = router;
