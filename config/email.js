const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"InstaClone" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your InstaClone Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #111;">InstaClone Password Reset</h2>
        <p>Use the code below to reset your password. This code expires in 10 minutes.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };