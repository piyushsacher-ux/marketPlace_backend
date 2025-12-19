const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const { purchaseItem } = require("../controllers/purchaseController");

router.post("/", auth, purchaseItem);

module.exports = router;
