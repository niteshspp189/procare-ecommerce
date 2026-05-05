import { 
  type SubscriberConfig, 
  type SubscriberArgs,
} from "@medusajs/medusa"
import { IOrderModuleService, ICustomerModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["shipping_address"]
  })
  
  if (!order.customer_id && order.email) {
    // Guest user - check if customer exists
    const [existingCustomers] = await customerModuleService.listAndCountCustomers({
        email: order.email
    })
    
    let customer = existingCustomers[0]

    if (!customer) {
        // Create customer automatically for the guest
        customer = await customerModuleService.createCustomers({
            email: order.email,
            first_name: order.shipping_address?.first_name || "Guest",
            last_name: order.shipping_address?.last_name || "User",
            phone: order.shipping_address?.phone
        })
    }

    // Link order to the customer (existing or new)
    await orderModuleService.updateOrders(order.id, {
        customer_id: customer.id
    })
    
    console.log(`Auto-linked order ${order.id} to customer ${customer.email}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
