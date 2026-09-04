import https from "https"
import Redis from "ioredis"
import { Client } from "pg"

const REDIS_TOKEN_KEY = "shiprocket:auth_token"
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days (Shiprocket tokens are valid for 10 days)

let redisInstance: Redis | null = null

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance
  try {
    const url = process.env.REDIS_URL || "redis://redis:6379"
    redisInstance = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 3000,
    })
    redisInstance.on("error", (err) => {
      // Graceful notice without crashing
      console.warn("[ShiprocketClient] Redis notice:", err.message)
    })
    return redisInstance
  } catch (e) {
    return null
  }
}

async function getCachedTokenFromRedis(): Promise<string | null> {
  try {
    const r = getRedis()
    if (!r) return null
    return await r.get(REDIS_TOKEN_KEY)
  } catch (e) {
    return null
  }
}

async function setCachedTokenInRedis(token: string): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    await r.set(REDIS_TOKEN_KEY, token, "EX", TOKEN_TTL_SECONDS)
  } catch (e) {
    console.warn("[ShiprocketClient] Failed to write token to Redis:", (e as any)?.message)
  }
}

async function clearCachedTokenInRedis(): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    await r.del(REDIS_TOKEN_KEY)
  } catch (e) {}
}

async function getCachedTokenFromDb(): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("ssl") ? { rejectUnauthorized: false } : false
  })
  try {
    await client.connect()
    const res = await client.query("SELECT token FROM shiprocket_token_cache WHERE id = 1 AND expires_at > NOW()")
    await client.end()
    return res.rows?.[0]?.token || null
  } catch (e) {
    try { await client.end() } catch (_) {}
    return null
  }
}

async function setCachedTokenInDb(token: string): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("ssl") ? { rejectUnauthorized: false } : false
  })
  try {
    await client.connect()
    await client.query(`
      INSERT INTO shiprocket_token_cache (id, token, expires_at, updated_at)
      VALUES (1, $1, NOW() + INTERVAL '7 days', NOW())
      ON CONFLICT (id) DO UPDATE 
      SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, updated_at = NOW()
    `, [token])
    await client.end()
  } catch (e) {
    try { await client.end() } catch (_) {}
    console.warn("[ShiprocketClient] Failed to persist token to DB:", (e as any)?.message)
  }
}

async function clearCachedTokenInDb(): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("ssl") ? { rejectUnauthorized: false } : false
  })
  try {
    await client.connect()
    await client.query("DELETE FROM shiprocket_token_cache WHERE id = 1")
    await client.end()
  } catch (e) {
    try { await client.end() } catch (_) {}
  }
}

function requestJson(urlStr: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "User-Agent": "ProCare-Ecommerce/1.0",
      ...(options.headers || {})
    }

    if (options.body) {
      headers["Content-Length"] = String(Buffer.byteLength(options.body))
    }

    const req = https.request(url, {
      method: options.method || "GET",
      headers,
      timeout: 15000,
    }, (res) => {
      let data = ""
      res.on("data", (chunk: any) => { data += chunk })
      res.on("end", () => {
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

  public async clearToken() {
    this.token = null
    this.tokenExpiresAt = 0
    await clearCachedTokenInRedis()
    await clearCachedTokenInDb()
  }

  public async authenticate(): Promise<string> {
    // 1. In-memory check
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token
    }

    // 2. Redis cache check
    const redisToken = await getCachedTokenFromRedis()
    if (redisToken) {
      this.token = redisToken
      this.tokenExpiresAt = Date.now() + 60 * 60 * 1000 // In-memory refreshed for 1 hr
      return redisToken
    }

    // 3. PostgreSQL database fallback check
    const dbToken = await getCachedTokenFromDb()
    if (dbToken) {
      this.token = dbToken
      this.tokenExpiresAt = Date.now() + 60 * 60 * 1000
      await setCachedTokenInRedis(dbToken)
      return dbToken
    }

    // 4. Remote authentication via Shiprocket API
    console.log("[ShiprocketClient] Authenticating with Shiprocket API...")
    const email = process.env.SHIPROCKET_EMAIL || ""
    const password = process.env.SHIPROCKET_PASSWORD || ""

    const data = await requestJson(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    if (data && data.token) {
      const token = data.token as string
      this.token = token
      this.tokenExpiresAt = Date.now() + 60 * 60 * 1000

      // Cache across Redis and PostgreSQL with 7-day TTL
      await setCachedTokenInRedis(token)
      await setCachedTokenInDb(token)

      console.log("[ShiprocketClient] ✅ Successfully authenticated & cached token for 7 days.")
      return token
    }

    console.error("[ShiprocketClient] ❌ Authentication failed:", JSON.stringify(data))
    await this.clearToken()
    throw new Error(`Shiprocket auth failed: ${JSON.stringify(data)}`)
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
        await this.clearToken()
        token = await this.authenticate()
        headers["Authorization"] = `Bearer ${token}`
        return await requestJson(url, { ...options, headers })
      }
      return res
    } catch (err: any) {
      if (err?.message?.includes("401") || err?.message?.includes("Unauthorized")) {
        console.warn("[ShiprocketClient] Caught 401 error. Re-authenticating...")
        await this.clearToken()
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
