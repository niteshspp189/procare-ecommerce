import { shiprocketClient } from "../modules/shiprocket/shiprocket-client"
import crypto from "crypto"

export async function syncOrderToShiprocket(orderId: string, container: any): Promise<{
  success: boolean
  message: string
  shipment_id?: string
  order_id?: string
  data?: any
}> {
  try {
    const pgConnection = container.__pg_connection__ || 
      (container.resolve ? container.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (container.resolve ? container.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      throw new Error("Could not resolve database connection from container")
    }

    // 1. Fetch Order Record
    const order = await pgConnection("order").where("id", orderId).first()
    if (!order) {
      return { success: false, message: `Order not found: ${orderId}` }
    }

    if (order.status === "canceled") {
      return { success: false, message: `Order ${orderId} is canceled. Skipping fulfillment.` }
    }

    // Check if already fulfilled in Medusa DB
    const existingFulfillments = await pgConnection("order_fulfillment").where("order_id", orderId)
    if (existingFulfillments.length > 0) {
      const activeFul = await pgConnection("fulfillment")
        .whereIn("id", existingFulfillments.map((f: any) => f.fulfillment_id))
        .whereNull("canceled_at")
        .first()

      if (activeFul) {
        return {
          success: true,
          message: `Order #${order.display_id} is already fulfilled in Medusa.`,
          shipment_id: activeFul.data?.shiprocket_shipment_id,
          order_id: activeFul.data?.shiprocket_order_id,
          data: activeFul.data,
        }
      }
    }

    // 2. Fetch shipping address, line items, and shipping method
    const address = await pgConnection("order_address").where("id", order.shipping_address_id).first()
    if (!address) {
      return { success: false, message: `Shipping address missing for order #${order.display_id}` }
    }

    const orderItems = await pgConnection("order_item").where("order_id", orderId)
    const lineItems = await pgConnection("order_line_item").whereIn("id", orderItems.map((i: any) => i.item_id))
    
    const shippingMethods = await pgConnection.raw(`
      SELECT osm.* 
      FROM order_shipping os
      JOIN order_shipping_method osm ON os.shipping_method_id = osm.id
      WHERE os.order_id = ?
    `, [orderId]).then((r: any) => r.rows || [])

    // 3. Prepare Channel Order ID & Phone
    const displayIdStr = (order.display_id || order.id || "").toString().padStart(8, "0")
    const channelOrderId = `OD${displayIdStr}`

    let cleanPhone = (address.phone || "9999999999").replace(/\D/g, "")
    if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      cleanPhone = cleanPhone.substring(2)
    }
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10)
    }
    if (cleanPhone.length !== 10) {
      cleanPhone = "9999999999"
    }

    // 4. Check if order already exists in Shiprocket to prevent duplicates
    let existingSrOrder: any = null
    try {
      const searchRes = await shiprocketClient.getOrders(`?search=${channelOrderId}`)
      if (searchRes && Array.isArray(searchRes.data)) {
        existingSrOrder = searchRes.data.find((o: any) => o.channel_order_id === channelOrderId && o.status !== "CANCELED")
      }
    } catch (searchErr: any) {
      console.warn(`[ShiprocketSync] Search duplicate check warning: ${searchErr.message}`)
    }

    let srResponse: any = null
    let srOrderId = ""
    let srShipmentId = ""
    let awbCode = ""

    if (existingSrOrder) {
      console.log(`[ShiprocketSync] Order ${channelOrderId} already exists in Shiprocket (ID: ${existingSrOrder.id}). Linking to Medusa.`)
      srOrderId = existingSrOrder.id.toString()
      srShipmentId = (existingSrOrder.shipments?.[0]?.id || existingSrOrder.shipment_id || "").toString()
      awbCode = existingSrOrder.shipments?.[0]?.awb || existingSrOrder.awb_code || ""
      srResponse = existingSrOrder
    } else {
      // 5. Build Shiprocket payload
      let totalItemDiscountSum = 0
      const itemsPayload = lineItems.map((item: any) => {
        const oi = orderItems.find((x: any) => x.item_id === item.id)
        const qty = Number(oi?.quantity || 1)
        const inclusivePrice = Math.round(Number(item.unit_price || 0))

        return {
          name: item.title || item.product_title || "Product",
          sku: item.variant_sku || item.variant_id || item.id,
          units: qty,
          selling_price: inclusivePrice,
          discount: 0,
          tax: 18,
          hsn: 0,
        }
      })

      const shippingCharges = Math.round(Number(shippingMethods[0]?.amount || 0))
      const undiscountedItemsTotal = itemsPayload.reduce((acc: number, it: any) => acc + (it.selling_price * it.units), 0)
      const grandTotal = undiscountedItemsTotal + shippingCharges - totalItemDiscountSum

      const orderPayload = {
        order_id: channelOrderId,
        order_date: new Date(order.created_at || Date.now()).toISOString().replace("T", " ").substring(0, 19),
        pickup_location: "Primary",
        channel_id: "",
        comment: "Prepaid Order via Medusa",
        billing_customer_name: address.first_name || "Customer",
        billing_last_name: address.last_name || "",
        billing_address: address.address_1 || "Address Line 1",
        billing_address_2: address.address_2 || "",
        billing_city: address.city || "City",
        billing_pincode: address.postal_code || "110001",
        billing_state: address.province || "State",
        billing_country: "India",
        billing_email: order.email || "support@propremiumcare.com",
        billing_phone: cleanPhone,
        shipping_is_billing: true,
        order_items: itemsPayload,
        payment_method: "Prepaid",
        shipping_charges: shippingCharges,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: totalItemDiscountSum,
        sub_total: undiscountedItemsTotal,
        grand_total: grandTotal,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      }

      console.log(`[ShiprocketSync] Creating order in Shiprocket for #${order.display_id}...`)
      srResponse = await shiprocketClient.createOrder(orderPayload)
      console.log(`[ShiprocketSync] Shiprocket response for #${order.display_id}:`, JSON.stringify(srResponse))

      if (!srResponse.order_id && !srResponse.shipment_id) {
        throw new Error(`Shiprocket API error: ${JSON.stringify(srResponse)}`)
      }

      srOrderId = srResponse.order_id.toString()
      srShipmentId = (srResponse.shipment_id || "").toString()
      awbCode = srResponse.awb_code || ""
    }

    // 6. Record Fulfillment in Medusa Database
    const fulId = `ful_01M0${crypto.randomBytes(10).toString("hex").toUpperCase()}`.substring(0, 30)
    const ordFulId = `ordful_01M0${crypto.randomBytes(10).toString("hex").toUpperCase()}`.substring(0, 30)
    const fulAddrId = `fuladdr_01M0${crypto.randomBytes(10).toString("hex").toUpperCase()}`.substring(0, 30)
    const now = new Date()

    // Insert fulfillment address
    await pgConnection("fulfillment_address").insert({
      id: fulAddrId,
      first_name: address.first_name,
      last_name: address.last_name,
      address_1: address.address_1,
      address_2: address.address_2,
      city: address.city,
      country_code: address.country_code || "in",
      province: address.province,
      postal_code: address.postal_code,
      phone: address.phone,
      created_at: now,
      updated_at: now,
    }).catch(() => {})

    // Insert fulfillment
    await pgConnection("fulfillment").insert({
      id: fulId,
      location_id: "sloc_01KPE40HQWCMTJ2KMZEMPD8R7Y",
      packed_at: now,
      shipped_at: null,
      delivered_at: null,
      canceled_at: null,
      data: JSON.stringify({
        awb_code: awbCode,
        shiprocket_order_id: srOrderId,
        shiprocket_response: srResponse,
        shiprocket_shipment_id: srShipmentId,
      }),
      provider_id: "shiprocket_shiprocket",
      shipping_option_id: shippingMethods[0]?.shipping_option_id || "so_01KPE40HV6FM4007SQXACQ6YEW",
      delivery_address_id: fulAddrId,
      created_at: now,
      updated_at: now,
      requires_shipping: true,
    })

    // Link fulfillment to order
    await pgConnection("order_fulfillment").insert({
      id: ordFulId,
      order_id: orderId,
      fulfillment_id: fulId,
      created_at: now,
      updated_at: now,
    })

    // Insert fulfillment items
    for (const item of lineItems) {
      const oi = orderItems.find((x: any) => x.item_id === item.id)
      const qty = oi?.quantity || "1"
      const fulItemId = `fulit_01M0${crypto.randomBytes(10).toString("hex").toUpperCase()}`.substring(0, 30)

      await pgConnection("fulfillment_item").insert({
        id: fulItemId,
        title: item.title || "Product",
        sku: item.variant_sku || "",
        barcode: "",
        quantity: qty.toString(),
        raw_quantity: JSON.stringify({ value: qty.toString(), precision: 20 }),
        line_item_id: item.id,
        inventory_item_id: null,
        fulfillment_id: fulId,
        created_at: now,
        updated_at: now,
      })
    }

    // Update fulfilled_quantity on order items
    for (const oi of orderItems) {
      await pgConnection("order_item").where("id", oi.id).update({
        fulfilled_quantity: oi.quantity,
        raw_fulfilled_quantity: JSON.stringify({ value: oi.quantity.toString(), precision: 20 }),
        updated_at: now,
      })
    }

    console.log(`[ShiprocketSync] ✅ Order #${order.display_id} successfully fulfilled and synced to Shiprocket (SR Order: ${srOrderId}, Shipment: ${srShipmentId})`)

    return {
      success: true,
      message: `Order #${order.display_id} fulfilled and synced to Shiprocket successfully!`,
      order_id: srOrderId,
      shipment_id: srShipmentId,
      data: srResponse,
    }
  } catch (error: any) {
    console.error(`[ShiprocketSync] ❌ Error syncing order ${orderId}:`, error)
    return {
      success: false,
      message: error.message || "Failed to sync order with Shiprocket",
    }
  }
}
