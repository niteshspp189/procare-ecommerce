import fetch from "node-fetch"

export class ShiprocketClient {
  private email: string
  private password: string
  private token: string | null = null
  private tokenExpiresAt: number = 0
  private baseUrl = "https://apiv2.shiprocket.in/v1/external"

  constructor() {
    this.email = process.env.SHIPROCKET_EMAIL || ""
    this.password = process.env.SHIPROCKET_PASSWORD || ""
  }

  private async authenticate() {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token
    }

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.password })
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Shiprocket auth failed: ${err}`)
    }

    const data = await response.json() as any
    this.token = data.token
    // Token typically expires in 10 days, we'll refresh every 24 hours just in case
    this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000 
    return this.token
  }

  public async createOrder(orderData: any) {
    const token = await this.authenticate()
    const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Shiprocket create order failed:", err)
      throw new Error(`Shiprocket create order failed: ${err}`)
    }

    return await response.json()
  }
}

export const shiprocketClient = new ShiprocketClient()
