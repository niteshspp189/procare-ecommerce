import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/framework"
import { IOrderModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import { createOrderFulfillmentWorkflow } from "@medusajs/core-flows"
import { syncOrderToShiprocket } from "../lib/shiprocket-sync"

export default async function autoFulfillOrderHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log(`[AutoFulfillSubscriber] 🚀 Attempting automatic Shiprocket fulfillment for Order: ${data.id}`)
  
  if (process.env.SHIPROCKET_ENV !== "production") {
    console.log(`[AutoFulfillSubscriber] Skipped: SHIPROCKET_ENV is not 'production'`)
    return
  }
  
  try {
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
    
    let order: any = null
    try {
      order = await orderModuleService.retrieveOrder(data.id, {
        relations: ["items", "shipping_methods", "shipping_address"]
      })
    } catch (relErr: any) {
      console.warn(`[AutoFulfillSubscriber] retrieveOrder with relations failed, trying simple retrieve:`, relErr.message)
      order = await orderModuleService.retrieveOrder(data.id)
    }

    if (!order) {
      console.warn(`[AutoFulfillSubscriber] Order not found via service for ${data.id}, invoking direct sync fallback`)
      await syncOrderToShiprocket(data.id, container)
      return
    }

    // Check if already fulfilled
    if ((order as any).fulfillment_status === "fulfilled") {
      console.log(`[AutoFulfillSubscriber] Order ${data.id} is already fulfilled. Skipping.`)
      return
    }

    // Get items to fulfill (all unfulfilled items)
    const itemsToFulfill = order.items?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
    }))

    if (!itemsToFulfill || itemsToFulfill.length === 0) {
      console.log(`[AutoFulfillSubscriber] No items found to fulfill via core flow for ${data.id}, running direct sync fallback`)
      await syncOrderToShiprocket(data.id, container)
      return
    }

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
      console.log(`[AutoFulfillSubscriber] ✅ Successfully created fulfillment for Order: ${data.id}`)
    }
  } catch (error: any) {
    console.warn(`[AutoFulfillSubscriber] Top-level exception for ${data.id}, running direct sync fallback:`, error.message)
    try {
      await syncOrderToShiprocket(data.id, container)
    } catch (fallbackErr: any) {
      console.error(`[AutoFulfillSubscriber] ❌ Direct sync fallback also encountered error for ${data.id}:`, fallbackErr.message)
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
