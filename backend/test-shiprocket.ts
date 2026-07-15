import { shiprocketClient } from "./src/modules/shiprocket/shiprocket-client"

async function test() {
  const orderData = {
    order_id: `TEST-${Date.now()}`,
    order_date: new Date().toISOString().split('T')[0],
    pickup_location: "Primary",
    billing_customer_name: "Test",
    billing_last_name: "Customer",
    billing_address: "123 Test St",
    billing_city: "Delhi",
    billing_pincode: "110001",
    billing_state: "Delhi",
    billing_country: "IN",
    billing_email: "test@example.com",
    billing_phone: "9999999999",
    shipping_is_billing: true,
    order_items: [
      {
        name: "Test Product",
        sku: "TEST-SKU",
        units: 1,
        selling_price: 1,
        discount: 0
      }
    ],
    payment_method: "Prepaid",
    shipping_charges: 1,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: 1,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 1
  }

  try {
    const res = await shiprocketClient.createOrder(orderData)
    console.log("Success:", JSON.stringify(res, null, 2))
  } catch (e: any) {
    console.error("Error:", e.message)
  }
}

test()
