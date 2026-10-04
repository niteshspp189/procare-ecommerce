import crypto from "crypto"

interface PresignedActionPayload {
  action: string
  exp: number
  iat: number
}

function getSigningSecret(): string {
  return process.env.JWT_SECRET || process.env.COOKIE_SECRET || "procare-presigned-action-secret-2026"
}

/**
 * Generates a tamper-proof presigned token for one-click action links in alert emails.
 * Default expiration is 6 hours (21,600,000 ms).
 */
export function generatePresignedActionToken(
  action: string, 
  expiresInMs: number = 6 * 60 * 60 * 1000
): { token: string; expiresAt: Date } {
  const secret = getSigningSecret()
  const exp = Date.now() + expiresInMs
  const iat = Date.now()
  const payload: PresignedActionPayload = { action, exp, iat }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url")
  const token = `${encodedPayload}.${signature}`

  return { token, expiresAt: new Date(exp) }
}

/**
 * Builds the full HTTPS URL with the presigned token.
 */
export function generatePresignedActionUrl(
  action: string, 
  expiresInMs: number = 6 * 60 * 60 * 1000,
  baseUrl: string = "https://www.propremiumcare.com"
): { url: string; expiresAt: Date } {
  const { token, expiresAt } = generatePresignedActionToken(action, expiresInMs)
  const url = `${baseUrl}/store/shiprocket/retry-fulfillment?token=${token}`
  return { url, expiresAt }
}

/**
 * Verifies the presigned token: checks HMAC signature, action matching, and 6-hour expiration.
 */
export function verifyPresignedActionToken(
  token: string, 
  expectedAction: string
): { valid: boolean; reason?: string; payload?: PresignedActionPayload } {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "Missing security token." }
  }

  const parts = token.split(".")
  if (parts.length !== 2) {
    return { valid: false, reason: "Malformed token format." }
  }

  const [encodedPayload, signature] = parts
  const secret = getSigningSecret()

  const expectedSignature = crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url")
  if (expectedSignature !== signature) {
    return { valid: false, reason: "Invalid or tampered signature." }
  }

  try {
    const payload: PresignedActionPayload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"))
    
    if (payload.action !== expectedAction) {
      return { valid: false, reason: `Action mismatch: expected '${expectedAction}', got '${payload.action}'.` }
    }

    if (Date.now() > payload.exp) {
      const expiredAt = new Date(payload.exp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      return { valid: false, reason: `Link expired at ${expiredAt} IST (valid for 6 hours).` }
    }

    return { valid: true, payload }
  } catch (err: any) {
    return { valid: false, reason: "Failed to decode token payload." }
  }
}
