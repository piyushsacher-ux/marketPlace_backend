const express=require("express");
const router=express.Router();
const {register,verifyEmail,login,forgotPassword,resetPassword,logout}=require("../controllers/authController");
const auth=require("../middlewares/authMiddleware")

router.post("/register",register);
router.post("/verify-email",verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", auth, logout);

module.exports=router;