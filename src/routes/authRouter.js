const express=require("express");
const router=express.Router();
const {register,verifyEmail,login,forgotPassword,resetPassword,logout}=require("../controllers/authController");
const auth=require("../middlewares/authMiddleware")
const joi=require("../utils/joiSchemas");
const validate = require("../middlewares/joiValidate");

router.post("/register",validate(joi.register),register);
router.post("/verify-email",validate(joi.verifyEmail),verifyEmail);
router.post("/login",validate(joi.login), login);
router.post("/forgot-password",validate(joi.forgotPassword), forgotPassword);
router.post("/reset-password",validate(joi.resetPassword), resetPassword);
router.post("/logout", auth, logout);

module.exports=router;