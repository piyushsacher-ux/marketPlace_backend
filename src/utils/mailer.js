const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

exports.sendOtpEmail = async ({ to, name, otp }) => {
  const templatePath = path.join(__dirname, "../templates/otpEmail.html");
  let html = fs.readFileSync(templatePath, "utf-8");

  html = html
    .replace("{{NAME}}", name)
    .replace("{{OTP}}", otp)
    .replace("{{LOGO_URL}}", `${process.env.BASE_URL}/public/logo.jpeg`);

  await transporter.sendMail({
    from: `"Marketplace System" <${process.env.MAIL_USER}>`,
    to,
    subject: "OTP Verification",
    html,
  });
};
