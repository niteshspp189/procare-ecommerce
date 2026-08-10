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

  public async checkServiceability(deliveryPostcode: string, isCod: boolean = false) {
    const token = await this.authenticate()
    const url = new URL(`${this.baseUrl}/courier/serviceability/`)
    url.searchParams.append("pickup_postcode", "201301")
    url.searchParams.append("delivery_postcode", deliveryPostcode)
    url.searchParams.append("cod", isCod ? "1" : "0")
    url.searchParams.append("weight", "1")

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const err = await response.text()
      console.warn("Shiprocket serviceability check failed:", err)
      return { serviceable: false, error: err }
    }

    const result = await response.json() as any
    const serviceable = !!(result?.status === 200 && result?.data?.available_courier_companies?.length > 0)
    return { serviceable, data: result }
  }

  public async getTrackingDetails(awbCode: string) {
    const token = await this.authenticate()
    const response = await fetch(`${this.baseUrl}/courier/track/awb/${awbCode}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const err = await response.text()
      console.warn("Shiprocket tracking check failed:", err)
      return { success: false, error: err }
    }

    return await response.json()
  }

  public async getShipmentTracking(shipmentId: string) {
    const token = await this.authenticate()
    const response = await fetch(`${this.baseUrl}/courier/track?shipment_id=${shipmentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const err = await response.text()
      console.warn("Shiprocket shipment tracking check failed:", err)
      return { success: false, error: err }
    }

    return await response.json()
  }

  public async assignAWB(shipmentId: string) {
    const token = await this.authenticate()
    const response = await fetch(`${this.baseUrl}/courier/assign/awb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        shipment_id: shipmentId,
        courier_id: "" // Empty lets Shiprocket choose auto-assigned courier if configured
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.warn("Shiprocket assign AWB failed:", err)
      throw new Error(err)
    }

    return await response.json()
  }
}

export const shiprocketClient = new ShiprocketClient()
