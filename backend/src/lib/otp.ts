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
    from: `"${process.env.SMTP_ADMIN_NAME || 'ProCare Store'}" <${process.env.SMTP_FROM || 'team@webclixs.in'}>`,
    replyTo: "customercare@mvscindia.com",
    to: email,
    subject: `Your Login OTP - ProCare Store`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
        <!-- Brand Header -->
        <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 3px solid #d4af37;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 2px;">PRO<span style="color: #d4af37;">GOLD</span></h1>
          <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">European Expertise. Indian Excellence.</p>
        </div>
        <!-- Content -->
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">ProCare Store Login</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Use the following one-time password (OTP) to securely sign in to your account. This code is valid for 10 minutes.</p>
          <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin: 28px auto; max-width: 280px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 13px;">If you didn't request this login code, please ignore this email.</p>
        </div>
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b; margin: 0;">© 2026 ProCare Store • MV Shoe Care Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
