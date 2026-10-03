const nodemailer = require("nodemailer");
const AppError = require("../utils/AppError");

const sendRegistrationCode = async (email, code) => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const port = Number(process.env.SMTP_PORT || 587);
  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !SMTP_FROM ||
    !Number.isInteger(port)
  ) {
    throw new AppError(
      "Email delivery is not configured. Set the SMTP environment variables.",
      503,
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: "Your Fieldhouse verification code",
    text: `Your Fieldhouse verification code is ${code}. It expires in 10 minutes.`,
    html: `<div style="font-family:Arial,sans-serif;color:#18251f;max-width:520px;margin:auto;padding:32px"><p style="letter-spacing:3px;color:#748b32;font-size:12px">FIELDHOUSE</p><h1 style="font-size:24px">Verify your email</h1><p>Use this code to finish creating your account. It expires in 10 minutes.</p><div style="font-size:32px;font-weight:bold;letter-spacing:10px;padding:18px 0">${code}</div><p style="font-size:13px;color:#748077">If you did not request this code, you can ignore this email.</p></div>`,
  });
};

module.exports = { sendRegistrationCode };
