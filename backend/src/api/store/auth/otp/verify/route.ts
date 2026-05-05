import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"
import { ICustomerModuleService } from "@medusajs/types"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { email, code } = req.body as { email: string; code: string }

  if (!email || !code) {
    return res.status(400).json({ message: "Email and code are required" })
  }

  const container = req.scope
  const dbConnection = container.resolve("pg_connection", { allowUnregistered: true })
  
  if (!dbConnection) {
    console.error("pg_connection not found in container")
    return res.status(500).json({ message: "Database connection failed" })
  }
  
  try {
    const query = `
      SELECT * FROM otp_code 
      WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `
    const result = await dbConnection.query(query, [email, code])
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid or expired OTP" })
    }

    const otpRecord = result.rows[0]

    // Mark OTP as used
    await dbConnection.query("UPDATE otp_code SET used = TRUE WHERE id = $1", [otpRecord.id])

    // Get or Create Customer
    const customerModuleService: ICustomerModuleService = req.scope.resolve(Modules.CUSTOMER)
    let [customers] = await customerModuleService.listAndCountCustomers({ email })
    let customer = customers[0]

    if (!customer) {
      customer = await customerModuleService.createCustomers({
        email,
        first_name: "User",
        last_name: "OTP",
      })
    }

    // In Medusa 2.0, we need to generate a session for the customer.
    // For now, we will return the customer info and a success message.
    // The storefront will then need to handle the session creation or 
    // we use the 'auth' module to sign a token.
    
    // Attempt to generate a token using Medusa's internal JWT service if available
    const authModuleService = req.scope.resolve(Modules.AUTH)
    
    // Medusa 2.0 auth uses providers. We'll use the customer's identity.
    // This is complex to do manually in a route without the full auth workflow.
    // Instead, we will return a success flag and the storefront will use a 
    // hidden password login or we'll provide a 'one-time-login' token.
    
    res.status(200).json({ 
      message: "OTP verified successfully", 
      customer_id: customer.id,
      email: customer.email,
      success: true 
    })
  } catch (error: any) {
    console.error("Error verifying OTP:", error)
    res.status(500).json({ message: "Verification failed", error: error.message })
  }
}
