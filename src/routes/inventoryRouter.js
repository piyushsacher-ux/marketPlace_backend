const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const {addItem,updateItem,deleteItem,getMyInventory} = require("../controllers/inventoryController");

router.post("/add", auth, addItem);
router.get("/getInventory", auth, getMyInventory);
router.patch("/:itemId", auth, updateItem);
router.delete("/:itemId", auth, deleteItem);

module.exports = router;
