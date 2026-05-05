import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendOTPEmail(email: string, code: string) {
  const mailOptions = {
    from: `"${process.env.SMTP_ADMIN_NAME || 'ProCare Store'}" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: `Your Login OTP - ProCare Store`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #00bda5;">ProCare Store</h2>
        <p>Hello,</p>
        <p>Use the following OTP to log in to your account. This code is valid for 10 minutes.</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">
          ${code}
        </div>
        <p style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">© 2026 ProCare Store. All rights reserved.</p>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
