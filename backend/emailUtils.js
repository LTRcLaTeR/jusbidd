const nodemailer = require("nodemailer");

// You must set these environment variables or replace with your own values
const EMAIL_USER = process.env.EMAIL_USER || "your_email@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "your_password";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

async function sendVerificationEmail(to, token) {
  const verifyUrl = `http://localhost:5002/verify-email?token=${token}`;
  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject: "Jusbid Email Verification",
    html: `<h2>ยืนยันอีเมล Jusbid</h2><p>คลิก <a href='${verifyUrl}'>ที่นี่</a> เพื่อยืนยันอีเมลของคุณ</p>`
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
