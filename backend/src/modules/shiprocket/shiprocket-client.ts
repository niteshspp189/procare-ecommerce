import https from "https"
import zlib from "zlib"

function requestJson(urlStr: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const headers = {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate",
      ...(options.headers || {})
    }

    const req = https.request(url, {
      method: options.method || "GET",
      headers,
      timeout: 10000,
    }, (res) => {
      let stream: any = res
      const enc = res.headers["content-encoding"]
      if (enc === "gzip") {
        stream = res.pipe(zlib.createGunzip())
      } else if (enc === "deflate") {
        stream = res.pipe(zlib.createInflate())
      }

      let data = ""
      stream.on("data", (chunk: any) => { data += chunk })
      stream.on("end", () => {
        try {
          const parsed = JSON.parse(data)
          resolve(parsed)
        } catch (e) {
          resolve(data)
        }
      })
    })

    req.on("timeout", () => {
      req.destroy()
      reject(new Error(`Shiprocket request timeout: ${urlStr}`))
    })

    req.on("error", (err) => {
      reject(err)
    })

    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

export class ShiprocketClient {
  private token: string | null = null
  private tokenExpiresAt: number = 0
  private baseUrl = "https://apiv2.shiprocket.in/v1/external"

  constructor() {}

  public clearToken() {
    this.token = null
    this.tokenExpiresAt = 0
  }

  private async authenticate(retries = 3, delayMs = 3000): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token
    }

    const email = process.env.SHIPROCKET_EMAIL || ""
    const password = process.env.SHIPROCKET_PASSWORD || ""

    let lastError: any = null

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const data = await requestJson(`${this.baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })

        if (data && data.token) {
          this.token = data.token as string
          this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000 
          return data.token as string
        }

        // If explicitly blocked by Shiprocket, abort immediately without retrying
        if (data && (data.message?.includes("User blocked") || data.message?.includes("failed login attempts"))) {
          this.clearToken()
          throw new Error(`Shiprocket auth failed: ${JSON.stringify(data)}`)
        }

        lastError = new Error(`Shiprocket auth failed: ${JSON.stringify(data)}`)
      } catch (err: any) {
        lastError = err
        if (err.message?.includes("User blocked") || err.message?.includes("failed login attempts")) {
          this.clearToken()
          throw err
        }
      }

      if (attempt < retries) {
        console.warn(`[ShiprocketClient] Auth attempt ${attempt} failed. Retrying in ${delayMs / 1000}s...`)
        await new Promise(r => setTimeout(r, delayMs))
      }
    }

    this.clearToken()
    throw lastError
  }

  private async requestWithAuth(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
    let token = await this.authenticate()
    const headers = {
      ...(options.headers || {}),
      "Authorization": `Bearer ${token}`
    }

    try {
      const res = await requestJson(url, { ...options, headers })
      if (res && (res.status_code === 401 || res.message === "Unauthorized" || res.message === "Token expired")) {
        console.warn("[ShiprocketClient] Received 401/Unauthorized from Shiprocket. Re-authenticating...")
        this.clearToken()
        token = await this.authenticate()
        headers["Authorization"] = `Bearer ${token}`
        return await requestJson(url, { ...options, headers })
      }
      return res
    } catch (err: any) {
      if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
        console.warn("[ShiprocketClient] Caught 401 error. Re-authenticating...")
        this.clearToken()
        token = await this.authenticate()
        headers["Authorization"] = `Bearer ${token}`
        return await requestJson(url, { ...options, headers })
      }
      throw err
    }
  }

  public async createOrder(orderData: any) {
    return await this.requestWithAuth(`${this.baseUrl}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    })
  }

  public async getOrders(queryParams: string = "") {
    const result = await this.requestWithAuth(`${this.baseUrl}/orders${queryParams}`, {
      method: "GET"
    })
    return result || { data: [] }
  }

  public async checkServiceability(deliveryPostcode: string, isCod: boolean = false) {
    const url = new URL(`${this.baseUrl}/courier/serviceability/`)
    url.searchParams.append("pickup_postcode", "201301")
    url.searchParams.append("delivery_postcode", deliveryPostcode)
    url.searchParams.append("cod", isCod ? "1" : "0")
    url.searchParams.append("weight", "1")

    const result = await this.requestWithAuth(url.toString(), {
      method: "GET"
    })

    const serviceable = !!(result?.status === 200 && result?.data?.available_courier_companies?.length > 0)
    return { serviceable, data: result }
  }

  public async getTrackingDetails(awbCode: string) {
    return await this.requestWithAuth(`${this.baseUrl}/courier/track/awb/${awbCode}`, {
      method: "GET"
    })
  }

  public async getShipmentTracking(shipmentId: string) {
    return await this.requestWithAuth(`${this.baseUrl}/courier/track?shipment_id=${shipmentId}`, {
      method: "GET"
    })
  }

  public async assignAWB(shipmentId: string) {
    return await this.requestWithAuth(`${this.baseUrl}/courier/assign/awb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        shipment_id: shipmentId,
        courier_id: ""
      })
    })
  }
}

export const shiprocketClient = new ShiprocketClient()
