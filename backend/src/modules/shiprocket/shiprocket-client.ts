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

  private async authenticate() {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token
    }

    const email = process.env.SHIPROCKET_EMAIL || ""
    const password = process.env.SHIPROCKET_PASSWORD || ""

    const data = await requestJson(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    if (!data || !data.token) {
      throw new Error(`Shiprocket auth failed: ${JSON.stringify(data)}`)
    }

    this.token = data.token
    this.tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000 
    return this.token
  }

  public async createOrder(orderData: any) {
    const token = await this.authenticate()
    return await requestJson(`${this.baseUrl}/orders/create/adhoc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    })
  }

  public async getOrders(queryParams: string = "") {
    const token = await this.authenticate()
    const result = await requestJson(`${this.baseUrl}/orders${queryParams}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    return result || { data: [] }
  }

  public async checkServiceability(deliveryPostcode: string, isCod: boolean = false) {
    const token = await this.authenticate()
    const url = new URL(`${this.baseUrl}/courier/serviceability/`)
    url.searchParams.append("pickup_postcode", "201301")
    url.searchParams.append("delivery_postcode", deliveryPostcode)
    url.searchParams.append("cod", isCod ? "1" : "0")
    url.searchParams.append("weight", "1")

    const result = await requestJson(url.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    const serviceable = !!(result?.status === 200 && result?.data?.available_courier_companies?.length > 0)
    return { serviceable, data: result }
  }

  public async getTrackingDetails(awbCode: string) {
    const token = await this.authenticate()
    return await requestJson(`${this.baseUrl}/courier/track/awb/${awbCode}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
  }

  public async getShipmentTracking(shipmentId: string) {
    const token = await this.authenticate()
    return await requestJson(`${this.baseUrl}/courier/track?shipment_id=${shipmentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
  }

  public async assignAWB(shipmentId: string) {
    const token = await this.authenticate()
    return await requestJson(`${this.baseUrl}/courier/assign/awb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        shipment_id: shipmentId,
        courier_id: ""
      })
    })
  }
}

export const shiprocketClient = new ShiprocketClient()
