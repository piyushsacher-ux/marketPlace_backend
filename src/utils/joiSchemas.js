const Joi = require("joi");

exports.register = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().required(),
  password: Joi.string().min(6).required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
});

exports.verifyEmail = Joi.object({
  otp: Joi.string().length(6).required(),
});

exports.login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

exports.forgotPassword = Joi.object({
  email: Joi.string().email().required(),
});

exports.resetPassword = Joi.object({
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});
