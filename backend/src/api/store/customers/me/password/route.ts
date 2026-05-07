import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"

import scrypt from "scrypt-kdf"
import { Pool } from "pg"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { old_password, new_password } = req.body as { old_password?: string; new_password: string }

  if (!new_password) {
    return res.status(400).json({ message: "New password is required" })
  }

  const authModuleService = req.scope.resolve(Modules.AUTH)
  const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
  
  const authContext = (req as any).auth_context
  if (!authContext || !authContext.actor_id) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    const customer = await customerModuleService.retrieveCustomer(authContext.actor_id)
    
    const identities = await (authModuleService as any).listProviderIdentities({
        entity_id: customer.email,
        provider: "emailpass"
    })

    const identity = identities[0]
    if (!identity) {
        return res.status(404).json({ message: "Auth identity not found" })
    }

    const hashConfig = { logN: 15, r: 8, p: 1 }
    const passwordHash = await scrypt.kdf(new_password, hashConfig)
    const hashedPassword = passwordHash.toString("base64")

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    })

    await pool.query(
        "UPDATE provider_identity SET provider_metadata = $1 WHERE id = $2",
        [JSON.stringify({ password: hashedPassword }), identity.id]
    )
    await pool.end()

    res.status(200).json({ message: "Password updated successfully" })
  } catch (error: any) {
    console.error("Error updating password:", error)
    res.status(500).json({ message: "Failed to update password", error: error.message })
  }
}
