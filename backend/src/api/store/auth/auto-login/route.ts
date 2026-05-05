import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"
import { IOrderModuleService } from "@medusajs/types"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const { order_id, token } = req.body as { order_id: string; token: string }

  if (!order_id) {
    return res.status(400).json({ message: "Order ID is required" })
  }

  console.log(`[Auto-login] API Hit for Order: ${order_id}`)

  const orderModuleService: IOrderModuleService = req.scope.resolve(Modules.ORDER)
  const authModuleService = req.scope.resolve(Modules.AUTH, { allowUnregistered: true })
  
  try {
    const order = await orderModuleService.retrieveOrder(order_id)
    
    // Security check: Either the token must match, OR the order must be very recent (last 10 mins)
    const isRecent = (new Date().getTime() - new Date(order.created_at).getTime()) < 10 * 60 * 1000
    const tokenMatches = token && order.metadata?.auto_login_token === token

    if (!tokenMatches && !isRecent) {
        console.warn(`[Auto-login] Security check failed for Order: ${order_id}. Token matches: ${tokenMatches}, Is recent: ${isRecent}`)
        return res.status(401).json({ message: "Auto-login period expired or invalid token" })
    }

    if (!authModuleService) {
        console.error("[Auto-login] Auth module not available in scope")
        return res.status(500).json({ message: "Auth module not available" })
    }

    // 1. Ensure Auth Identity exists
    const [identities] = await authModuleService.listAndCountProviderIdentities({
        entity_id: order.email,
        provider: "emailpass"
    })

    let identity = identities[0]
    if (!identity) {
        console.log(`[Auto-login] Creating Auth Identity for: ${order.email}`)
        const authIdentity = await authModuleService.createAuthIdentities({})
        
        console.log(`[Auto-login] Linking Provider Identity (emailpass) for: ${order.email}`)
        identity = await authModuleService.createProviderIdentities({
            auth_identity_id: authIdentity.id,
            entity_id: order.email,
            provider: "emailpass",
        })
    }

    // 2. Find Customer ID
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    const result = await customerModuleService.listCustomers({ email: order.email })
    
    let customer: any = null
    if (Array.isArray(result)) {
        customer = result[0]
    } else {
        customer = result
    }
    
    if (!customer) {
        console.log(`[Auto-login] Creating customer for: ${order.email}`)
        try {
            customer = await customerModuleService.createCustomers({
                email: order.email,
                first_name: order.shipping_address?.first_name || "Guest",
                last_name: order.shipping_address?.last_name || "Customer",
            })
        } catch (e) {
            const [retryCustomers] = await customerModuleService.listCustomers({ email: order.email })
            customer = Array.isArray(retryCustomers) ? retryCustomers[0] : retryCustomers
        }
    }
    
    if (!customer) {
        throw new Error(`Failed to find or create customer for email: ${order.email}`)
    }

    // 3. Generate token manually using jsonwebtoken
    let tokenValue = ""
    try {
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
        console.log(`[Auto-login] Success! Session ready for customer: ${customer.id}`)
    } catch (e: any) {
        console.error(`[Auto-login] Manual JWT signing failed:`, e)
    }

    res.status(200).json({ 
        message: "Auto-login authorized",
        token: tokenValue,
        email: order.email,
        success: !!tokenValue 
    })
  } catch (error: any) {
    console.error("[Auto-login] Error:", error)
    res.status(500).json({ message: "Auto-login failed", error: error.message })
  }
}
