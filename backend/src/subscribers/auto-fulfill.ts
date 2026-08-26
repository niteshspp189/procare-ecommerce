import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/framework"
import { IOrderModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import { createOrderFulfillmentWorkflow } from "@medusajs/core-flows"
import { syncOrderToShiprocket } from "../lib/shiprocket-sync"

export default async function autoFulfillOrderHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log(`[AutoFulfillSubscriber] Attempting automatic Shiprocket fulfillment for Order: ${data.id}`)
  
  if (process.env.SHIPROCKET_ENV !== "production") {
    console.log(`[AutoFulfillSubscriber] Skipped: SHIPROCKET_ENV is not 'production'`)
    return
  }
  
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  
  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items.item", "shipping_methods", "shipping_address"]
  })

  // We check if it's already fulfilled
  if ((order as any).fulfillment_status === "fulfilled") {
    return
  }

  // Get items to fulfill (all unfulfilled items)
  const itemsToFulfill = order.items?.map(item => ({
    id: item.id,
    quantity: item.quantity,
  }))

  if (!itemsToFulfill || itemsToFulfill.length === 0) {
    return
  }

  try {
    const { result, errors } = await createOrderFulfillmentWorkflow(container).run({
      input: {
        order_id: order.id,
        items: itemsToFulfill,
        labels: [],
        location_id: "sloc_01KPE40HQWCMTJ2KMZEMPD8R7Y", // Primary India Warehouse
      },
      throwOnError: false,
    })

    if (errors && errors.length > 0) {
      console.warn(`[AutoFulfillSubscriber] Core workflow reported error for ${data.id}, running direct sync fallback:`, errors[0].error?.message)
      await syncOrderToShiprocket(data.id, container)
    } else {
      console.log(`[AutoFulfillSubscriber] Successfully created fulfillment for Order: ${data.id}`)
    }
  } catch (error: any) {
    console.warn(`[AutoFulfillSubscriber] Exception during workflow for ${data.id}, running direct sync fallback:`, error.message)
    await syncOrderToShiprocket(data.id, container)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
