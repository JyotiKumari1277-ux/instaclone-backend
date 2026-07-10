const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (toEmail, otp) => {
  await resend.emails.send({
    from: "InstaClone <onboarding@resend.dev>",
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
  });
};

module.exports = { sendOtpEmail };