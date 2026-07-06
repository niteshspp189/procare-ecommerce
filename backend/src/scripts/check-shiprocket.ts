import fetch from "node-fetch"

async function checkOrder() {
  const email = process.env.SHIPROCKET_EMAIL
  const password = process.env.SHIPROCKET_PASSWORD
  const baseUrl = "https://apiv2.shiprocket.in/v1/external"

  const authRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })

  if (!authRes.ok) {
    console.error("Auth failed:", await authRes.text())
    return
  }

  const { token } = await authRes.json() as any

  const ordersRes = await fetch(`${baseUrl}/orders?per_page=10`, {
    headers: { "Authorization": `Bearer ${token}` }
  })

  if (!ordersRes.ok) {
    console.error("Failed to fetch orders:", await ordersRes.text())
    return
  }

  const data = await ordersRes.json() as any
  console.log("Latest Orders:", JSON.stringify(data.data.map((o: any) => ({
    id: o.id,
    channel_order_id: o.channel_order_id,
    status: o.status,
    created_at: o.created_at,
    total: o.total,
    customer_name: o.customer_name
  })), null, 2))
}

checkOrder()
