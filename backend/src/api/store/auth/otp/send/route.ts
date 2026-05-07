import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateOTP, sendOTPEmail } from "../../../../../lib/otp"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { email } = req.body as { email: string }

  if (!email) {
    return res.status(400).json({ message: "Email is required" })
  }

  const code = generateOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  try {
    // Use direct pg Pool since pg_connection is not reliably exposed in Medusa 2.0 container
    const { Pool } = require("pg")
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    })

    if (!pool) {
        console.error("Failed to create pg pool")
        return res.status(500).json({ message: "Database connection failed" })
    }

    const query = `
      INSERT INTO otp_code (email, code, expires_at)
      VALUES ($1, $2, $3)
    `
    await pool.query(query, [email, code, expiresAt])
    await pool.end()

    await sendOTPEmail(email, code)

    res.status(200).json({ message: "OTP sent successfully" })
  } catch (error: any) {
    console.error("Error sending OTP:", error)
    res.status(500).json({ message: "Failed to send OTP", error: error.message })
  }
}
