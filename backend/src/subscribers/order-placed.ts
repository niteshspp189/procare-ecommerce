import { 
  type SubscriberConfig, 
  type SubscriberArgs,
} from "@medusajs/framework"
import { IOrderModuleService, ICustomerModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import { generateOTP, sendOTPEmail } from "../lib/otp"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log(`[OrderPlacedSubscriber] Handling event for Order ID: ${data.id}`)
  
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  
  let authModuleService: any
  try {
    authModuleService = container.resolve(Modules.AUTH)
  } catch (e) {
    console.log("[OrderPlacedSubscriber] Auth module not available")
  }

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["shipping_address"]
  })
  
  if (!order.customer_id && order.email) {
    console.log(`[OrderPlacedSubscriber] Processing guest order for ${order.email}`)
    
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
        console.log(`[OrderPlacedSubscriber] Created new customer profile: ${customer.id}`)
    }

    // 2. Initialize auth identity
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
                console.log(`[OrderPlacedSubscriber] Initialized auth identity for ${order.email}`)
            }
        } catch (e) {
            console.error("[OrderPlacedSubscriber] Failed auth identity:", e)
        }
    }

    // 3. Link order and set auto_login_token
    const autoLoginToken = Math.random().toString(36).substring(2, 15)
    await orderModuleService.updateOrders(order.id, {
        customer_id: customer.id,
        metadata: {
            ...order.metadata,
            auto_login_token: autoLoginToken
        }
    })
    console.log(`[OrderPlacedSubscriber] Linked order ${order.id} and set auto_login_token`)
    
    // 4. Send Welcome OTP (For all guest checkouts to ensure they can login)
    try {
        const code = generateOTP()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
        
        const dbConnection = container.resolve("pg_connection")
        await dbConnection.query(
            "INSERT INTO otp_code (email, code, expires_at) VALUES ($1, $2, $3)",
            [order.email, code, expiresAt]
        )

        await sendOTPEmail(order.email, code)
        console.log(`[OrderPlacedSubscriber] Sent welcome OTP to ${order.email}`)
    } catch (e) {
        console.error("[OrderPlacedSubscriber] Failed welcome OTP:", e)
    }
  } else if (order.customer_id) {
      console.log(`[OrderPlacedSubscriber] Order already has customer_id: ${order.customer_id}`)
      // Even for existing customers, we set an auto_login_token for convenience
      const autoLoginToken = Math.random().toString(36).substring(2, 15)
      await orderModuleService.updateOrders(order.id, {
          metadata: {
              ...order.metadata,
              auto_login_token: autoLoginToken
          }
      })
      console.log(`[OrderPlacedSubscriber] Set auto_login_token for existing customer`)
  }

  // 5. Send Order Confirmation Email (for all orders)
  try {
    const { sendOrderConfirmationEmail } = require("../lib/email")
    // Retrieve full order with items and addresses for the invoice
    const fullOrder = await orderModuleService.retrieveOrder(data.id, {
        relations: ["shipping_address", "items", "billing_address"]
    })
    await sendOrderConfirmationEmail(fullOrder)
    console.log(`[OrderPlacedSubscriber] Sent order confirmation email for ${data.id}`)
  } catch (e) {
    console.error("[OrderPlacedSubscriber] Failed to send confirmation email:", e)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
