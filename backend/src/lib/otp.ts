import nodemailer from "nodemailer"

const smtpPort = parseInt(process.env.SMTP_PORT || "587")
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "email-smtp.us-east-1.amazonaws.com",
  port: smtpPort,
  secure: smtpPort === 465, // true for 465 (implicit TLS), false for 587 (STARTTLS)
  requireTLS: smtpPort !== 465, // force STARTTLS for port 587 (AWS SES)
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
    subject: `Your Login OTP - ProPremium Care`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); background-color: #ffffff;">
        <!-- Brand Header -->
        <div style="background-color: #ffffff; padding: 24px; text-align: center; border-bottom: 3px solid #00bda5;">
          <a href="${process.env.STORE_URL || 'https://propremiumcare.com'}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img src="${process.env.STORE_URL || 'https://propremiumcare.com'}/images/logos/logo.png" alt="PRO" style="height: 48px; width: auto; max-width: 200px; display: inline-block; vertical-align: middle;" />
          </a>
        </div>
        <!-- Content -->
        <div style="padding: 32px 24px; text-align: center;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">ProPremium Care Login</h2>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Use the following one-time password (OTP) to securely sign in to your account. This code is valid for 10 minutes.</p>
          <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin: 28px auto; max-width: 280px; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">
            ${code}
          </div>
          <p style="color: #64748b; font-size: 13px;">If you didn't request this login code, please ignore this email.</p>
        </div>
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b; margin: 0;">© 2026 ProPremium Care • MV Shoe Care Pvt Ltd. All rights reserved.</p>
        </div>
      </div>
    `,
  }

  try {
    console.log(`[OTPService] Attempting to send OTP email via SES...`)
    return await transporter.sendMail(mailOptions)
  } catch (sesError: any) {
    console.warn(`[OTPService] Primary SES SMTP failed (${sesError.message}). Attempting fallback to Gmail SMTP...`)
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "team@webclixs.in",
          pass: "wsek gghl znno gedt",
        },
      })
      
      const fallbackMailOptions = {
        ...mailOptions,
        from: `"ProCare Store" <team@webclixs.in>`
      }
      
      const info = await fallbackTransporter.sendMail(fallbackMailOptions)
      console.log(`[OTPService] Fallback OTP email sent successfully via Gmail!`)
      return info
    } catch (gmailError: any) {
      console.error(`[OTPService] Both primary SES and fallback Gmail SMTP failed:`, gmailError.message)
      throw new Error(`Email sending failed. Primary SES error: ${sesError.message}. Fallback Gmail error: ${gmailError.message}`)
    }
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
