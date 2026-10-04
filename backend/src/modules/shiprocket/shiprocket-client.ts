import https from "https"
import Redis from "ioredis"
import { Client } from "pg"

const REDIS_TOKEN_KEY = "shiprocket:auth_token"
const DEFAULT_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60 // 7-day fallback

/**
 * Dynamically extract TTL from Shiprocket JWT token.
 * Shiprocket JWTs have a 10-day validity (864,000s). We keep a 1-hour safety buffer.
 */
function getJwtTtlSeconds(token: string): number {
  try {
    const parts = token.split(".")
    if (parts.length >= 2) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"))
      if (typeof payload.exp === "number") {
        const remaining = payload.exp - Math.floor(Date.now() / 1000)
        // Keep a 1-hour buffer (3600s) before actual expiration, minimum 60s
        return Math.max(60, remaining - 3600)
      }
    }
  } catch (e) {
    console.warn("[ShiprocketClient] Could not parse JWT exp:", (e as any)?.message)
  }
  return DEFAULT_TOKEN_TTL_SECONDS
}

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
    const ttl = getJwtTtlSeconds(token)
    await r.set(REDIS_TOKEN_KEY, token, "EX", ttl)
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

interface DbTokenRecord {
  token: string
  remainingSeconds: number
  expiresAt: Date
}

const RENEWAL_THRESHOLD_SECONDS = 48 * 60 * 60 // 48-hour proactive renewal window (Day 8 of 10)
const BACKGROUND_RENEWAL_COOLDOWN_MS = 6 * 60 * 60 * 1000 // Attempt background renewal at most once per 6 hours

async function getCachedTokenFromDb(): Promise<DbTokenRecord | null> {
  if (!process.env.DATABASE_URL) return null
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("ssl") ? { rejectUnauthorized: false } : false
  })
  try {
    await client.connect()
    const res = await client.query(`
      SELECT token, 
             ROUND(EXTRACT(EPOCH FROM (expires_at - NOW()))) as remaining_seconds,
             expires_at
      FROM shiprocket_token_cache 
      WHERE id = 1
    `)
    await client.end()
    if (!res.rows?.[0]?.token) return null
    return {
      token: res.rows[0].token,
      remainingSeconds: parseInt(res.rows[0].remaining_seconds, 10) || 0,
      expiresAt: new Date(res.rows[0].expires_at)
    }
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
    const ttlSeconds = getJwtTtlSeconds(token)
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
    await client.connect()
    await client.query(`
      INSERT INTO shiprocket_token_cache (id, token, expires_at, updated_at)
      VALUES (1, $1, $2, NOW())
      ON CONFLICT (id) DO UPDATE 
      SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, updated_at = NOW()
    `, [token, expiresAt])
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

  // Single-flight authentication mutex to prevent concurrent login hammering
  private static activeAuthPromise: Promise<string> | null = null

  // Cooldown tracker for background renewal attempts
  private static lastBackgroundRenewalAttempt: number = 0

  constructor() {}

  public async clearToken() {
    this.token = null
    this.tokenExpiresAt = 0
    await clearCachedTokenInRedis()
    await clearCachedTokenInDb()
  }

  public async authenticate(): Promise<string> {
    // 1. In-memory check (fastest path)
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token
    }

    // 2. Redis cache check
    const redisToken = await getCachedTokenFromRedis()
    if (redisToken) {
      this.token = redisToken
      this.tokenExpiresAt = Date.now() + 60 * 60 * 1000 // In-memory refreshed for 1 hr

      // Check proactive renewal via non-blocking check
      this.checkAndTriggerProactiveRenewal()
      return redisToken
    }

    // 3. PostgreSQL database fallback check
    const dbRecord = await getCachedTokenFromDb()
    if (dbRecord && dbRecord.remainingSeconds > 0) {
      this.token = dbRecord.token
      this.tokenExpiresAt = Date.now() + 60 * 60 * 1000
      await setCachedTokenInRedis(dbRecord.token)

      // Proactive Renewal: If token has less than 48 hours remaining (Day 8 or 9)
      if (dbRecord.remainingSeconds < RENEWAL_THRESHOLD_SECONDS) {
        this.triggerBackgroundRenewal()
      }

      return dbRecord.token
    }

    // 4. Remote authentication via Shiprocket API (Guarded with single-flight mutex)
    if (ShiprocketClient.activeAuthPromise) {
      return await ShiprocketClient.activeAuthPromise
    }

    ShiprocketClient.activeAuthPromise = this.executeRemoteAuth()
    try {
      const newToken = await ShiprocketClient.activeAuthPromise
      return newToken
    } finally {
      ShiprocketClient.activeAuthPromise = null
    }
  }

  /**
   * Non-blocking asynchronous check for proactive renewal when serving from Redis.
   */
  private checkAndTriggerProactiveRenewal(): void {
    getCachedTokenFromDb().then((record) => {
      if (record && record.remainingSeconds > 0 && record.remainingSeconds < RENEWAL_THRESHOLD_SECONDS) {
        this.triggerBackgroundRenewal()
      }
    }).catch(() => {})
  }

  /**
   * Quietly renews the token in the background while the active token is still valid.
   */
  private triggerBackgroundRenewal(): void {
    const now = Date.now()
    if (now - ShiprocketClient.lastBackgroundRenewalAttempt < BACKGROUND_RENEWAL_COOLDOWN_MS) {
      return // Avoid spamming within cooldown
    }
    if (ShiprocketClient.activeAuthPromise) {
      return // Renewal already in flight
    }

    ShiprocketClient.lastBackgroundRenewalAttempt = now
    console.log("[ShiprocketClient] 🔄 Proactively renewing Shiprocket token in background (within 48-hour window)...")

    ShiprocketClient.activeAuthPromise = this.executeRemoteAuth()
    ShiprocketClient.activeAuthPromise
      .then(() => {
        console.log("[ShiprocketClient] ✅ Proactive background token renewal succeeded!")
      })
      .catch((err) => {
        console.warn("[ShiprocketClient] ⚠️ Proactive background renewal attempt postponed:", err.message)
      })
      .finally(() => {
        ShiprocketClient.activeAuthPromise = null
      })
  }

  /**
   * Resilient remote authentication with exponential backoff and anti-hammering guard.
   */
  private async executeRemoteAuth(): Promise<string> {
    console.log("[ShiprocketClient] Authenticating with Shiprocket API...")
    const email = process.env.SHIPROCKET_EMAIL || ""
    const password = process.env.SHIPROCKET_PASSWORD || ""

    if (!email || !password) {
      throw new Error("Shiprocket credentials missing (SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD)")
    }

    let lastData: any = null
    const maxAttempts = 2

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const data = await requestJson(`${this.baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        })

        if (data && data.token) {
          const token = data.token as string
          this.token = token
          this.tokenExpiresAt = Date.now() + 60 * 60 * 1000

          // Cache across Redis and PostgreSQL with dynamic TTL (up to 10 days)
          await setCachedTokenInRedis(token)
          await setCachedTokenInDb(token)

          const remainingDays = (getJwtTtlSeconds(token) / 86400).toFixed(1)
          console.log(`[ShiprocketClient] ✅ Successfully authenticated & cached token for ~${remainingDays} days.`)
          return token
        }

        lastData = data
        console.warn(`[ShiprocketClient] Authentication attempt ${attempt}/${maxAttempts} rejected:`, JSON.stringify(data))

        if (attempt < maxAttempts) {
          console.log("[ShiprocketClient] Cooling down 2500ms before auth retry to absorb rate-limit burst...")
          await new Promise((resolve) => setTimeout(resolve, 2500))
        }
      } catch (err: any) {
        lastData = { message: err.message }
        console.warn(`[ShiprocketClient] Authentication attempt ${attempt}/${maxAttempts} network error:`, err.message)
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2500))
        }
      }
    }

    console.error("[ShiprocketClient] ❌ Authentication failed after retries:", JSON.stringify(lastData))

    // Emergency Grace Fallback: If DB has a cached token whose true JWT exp is within 2 hours, use it as fallback
    try {
      const dbRecord = await getCachedTokenFromDb()
      if (dbRecord && dbRecord.token) {
        const parts = dbRecord.token.split(".")
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"))
          if (typeof payload.exp === "number") {
            const rawRemaining = payload.exp - Math.floor(Date.now() / 1000)
            if (rawRemaining > -7200) { // Within 2 hours grace period
              console.warn(`[ShiprocketClient] 🛡️ Using DB fallback token with ${rawRemaining}s grace period while auth cluster recovers.`)
              this.token = dbRecord.token
              this.tokenExpiresAt = Date.now() + 5 * 60 * 1000
              return dbRecord.token
            }
          }
        }
      }
    } catch (_) {}

    throw new Error(`Shiprocket auth failed: ${JSON.stringify(lastData)}`)
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
