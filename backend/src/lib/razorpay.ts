import https from "https"

export function razorpayGet(path: string): Promise<any> {
  const keyId = process.env.RAZORPAY_ID || process.env.RAZORPAY_KEY_ID || ""
  const keySecret = process.env.RAZORPAY_SECRET || process.env.RAZORPAY_KEY_SECRET || ""

  if (!keyId || !keySecret) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
    const options = {
      hostname: "api.razorpay.com",
      path: `/v1${path}`,
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      timeout: 8000,
    }

    const req = https.request(options, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve(null)
        }
      })
    })

    req.on("error", () => resolve(null))
    req.on("timeout", () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
}

/**
 * Validates if an order or payment is genuinely captured in Razorpay
 */
export async function isRazorpayPaymentCaptured(paymentIdOrOrderId: string): Promise<{
  captured: boolean
  status: string
  amount?: number
  paymentId?: string
  data?: any
}> {
  if (!paymentIdOrOrderId) {
    return { captured: false, status: "missing_id" }
  }

  try {
    if (paymentIdOrOrderId.startsWith("pay_")) {
      const payment = await razorpayGet(`/payments/${paymentIdOrOrderId}`)
      if (payment && payment.status === "captured") {
        return {
          captured: true,
          status: "captured",
          amount: payment.amount ? payment.amount / 100 : undefined,
          paymentId: payment.id,
          data: payment,
        }
      }
      return {
        captured: false,
        status: payment?.status || "not_found",
        data: payment,
      }
    } else if (paymentIdOrOrderId.startsWith("order_")) {
      const order = await razorpayGet(`/orders/${paymentIdOrOrderId}`)
      if (order && order.status === "paid") {
        const payments = await razorpayGet(`/orders/${paymentIdOrOrderId}/payments`)
        const capturedPay = payments?.items?.find((p: any) => p.status === "captured")
        return {
          captured: true,
          status: "captured",
          amount: (capturedPay?.amount || order.amount_paid) / 100,
          paymentId: capturedPay?.id,
          data: capturedPay || order,
        }
      }
      return {
        captured: false,
        status: order?.status || "not_paid",
        data: order,
      }
    }
  } catch (e: any) {
    console.error("[RazorpayVerify] Error verifying payment:", e.message)
  }

  return { captured: false, status: "error" }
}
