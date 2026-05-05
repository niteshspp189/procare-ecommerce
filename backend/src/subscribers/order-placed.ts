import { 
  type SubscriberConfig, 
  type SubscriberArgs,
} from "@medusajs/framework"
import { IOrderModuleService, ICustomerModuleService, IAuthModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  
  // Note: Auth module might have a different resolution in some versions, 
  // but we'll attempt to resolve it to initialize the identity.
  let authModuleService: any
  try {
    authModuleService = container.resolve(Modules.AUTH)
  } catch (e) {
    console.log("Auth module not found or restricted in this context")
  }

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["shipping_address"]
  })
  
  if (!order.customer_id && order.email) {
    // 1. Find or create customer profile
    const [existingCustomers] = await customerModuleService.listAndCountCustomers({
        email: order.email
    })
    
    let customer = existingCustomers[0]

    if (!customer) {
        customer = await customerModuleService.createCustomers({
            email: order.email,
            first_name: order.shipping_address?.first_name || "Guest",
            last_name: order.shipping_address?.last_name || "User",
            phone: order.shipping_address?.phone
        })
        console.log(`Created new customer profile for ${order.email}`)
    }

    // 2. Attempt to initialize auth identity if module is available
    // This enables the "Forgot Password" flow for the guest email
    if (authModuleService) {
        try {
            const [identities] = await authModuleService.listAndCountProviderIdentities({
                entity_id: order.email,
                provider: "emailpass"
            })
            
            if (identities.length === 0) {
                await authModuleService.createProviderIdentities({
                    entity_id: order.email,
                    provider: "emailpass",
                })
                console.log(`Initialized auth identity for ${order.email}`)
            }
        } catch (e) {
            console.error("Could not initialize auth identity:", e)
        }
    }

    // 3. Link order to customer
    await orderModuleService.updateOrders(order.id, {
        customer_id: customer.id,
        metadata: {
            ...order.metadata,
            auto_login_token: Math.random().toString(36).substring(2, 15)
        }
    })
    
    // 4. Send Welcome Email with instructions
    try {
        const { generateOTP, sendOTPEmail } = require("../lib/otp")
        const code = generateOTP()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
        
        const dbConnection = container.resolve("pg_connection")
        await dbConnection.query(
            "INSERT INTO otp_code (email, code, expires_at) VALUES ($1, $2, $3)",
            [order.email, code, expiresAt]
        )

        await sendOTPEmail(order.email, code)
        console.log(`Sent welcome OTP to ${order.email}`)
    } catch (e) {
        console.error("Failed to send welcome OTP:", e)
    }
    
    console.log(`Linked order ${order.id} to customer ${customer.email}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
