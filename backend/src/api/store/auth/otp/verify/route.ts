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

  const { Pool } = require("pg")
  const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
  })
  
  if (!pool) {
    console.error("Failed to create pg pool")
    return res.status(500).json({ message: "Database connection failed" })
  }
  
  try {
    const query = `
      SELECT * FROM otp_code 
      WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `
    const result = await pool.query(query, [email, code])
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid or expired OTP" })
    }

    const otpRecord = result.rows[0]

    await pool.query("UPDATE otp_code SET used = TRUE WHERE id = $1", [otpRecord.id])
    await pool.end()

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

    // Generate token for auto-login
    const authModuleService = req.scope.resolve(Modules.AUTH)
    let tokenValue = ""
    
    try {
        // Find or create auth identity
        const identities = await (authModuleService as any).listProviderIdentities({
            entity_id: email,
            provider: "emailpass"
        })

        let identity = identities[0]
        if (!identity) {
            const authIdentity = await authModuleService.createAuthIdentities({})
            identity = await (authModuleService as any).createProviderIdentities([{
                auth_identity_id: authIdentity.id,
                entity_id: email,
                provider: "emailpass",
            }])
        }

        const jwt = require("jsonwebtoken")
        const secret = process.env.JWT_SECRET || "supersecret"
        
        tokenValue = jwt.sign(
            { 
                actor_id: customer.id, 
                actor_type: "customer", 
                auth_identity_id: identity.auth_identity_id 
            }, 
            secret,
            { expiresIn: "7d" }
        )
    } catch (e) {
        console.error("[OTP Verify] Failed to generate token:", e)
    }
    
    res.status(200).json({ 
      message: "OTP verified successfully", 
      customer_id: customer.id,
      email: customer.email,
      token: tokenValue,
      success: true 
    })
  } catch (error: any) {
    console.error("Error verifying OTP:", error)
    res.status(500).json({ message: "Verification failed", error: error.message })
  }
}
