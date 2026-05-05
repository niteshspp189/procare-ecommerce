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
    const query = `
      INSERT INTO otp_code (email, code, expires_at)
      VALUES ($1, $2, $3)
    `
    // We use the database connection from the container if available, 
    // or direct pg client for speed in this custom implementation
    const dbConnection = req.scope.resolve("pg_connection")
    await dbConnection.query(query, [email, code, expiresAt])

    await sendOTPEmail(email, code)

    res.status(200).json({ message: "OTP sent successfully" })
  } catch (error: any) {
    console.error("Error sending OTP:", error)
    res.status(500).json({ message: "Failed to send OTP", error: error.message })
  }
}
