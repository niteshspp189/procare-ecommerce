import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs"

const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".webp"]

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { filename, base64, dataUrl } = req.body as any

    if (!base64 && !dataUrl) {
      return res.status(400).json({
        success: false,
        message: "Base64 or dataUrl image payload is required",
      })
    }

    let fileBuffer: Buffer
    let ext = ""

    if (dataUrl && typeof dataUrl === "string") {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, message: "Invalid dataUrl format" })
      }
      const mimeType = matches[1].toLowerCase()
      fileBuffer = Buffer.from(matches[2], "base64")
      
      if (mimeType === "image/png") ext = ".png"
      else if (mimeType === "image/webp") ext = ".webp"
      else if (mimeType === "image/jpeg" || mimeType === "image/jpg") ext = ".jpg"
      else {
        return res.status(400).json({
          success: false,
          message: `Format '${mimeType}' is not supported. Only WebP, PNG, and JPEG formats are allowed.`,
        })
      }
    } else {
      fileBuffer = Buffer.from(base64, "base64")
      if (filename) {
        ext = path.extname(filename).toLowerCase()
      }
    }

    if (!ALLOWED_EXTS.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `File format '${ext}' is not supported. Only WebP (.webp), PNG (.png), and JPEG (.jpg, .jpeg) formats are allowed.`,
      })
    }

    // Strict 1MB max file size check (1,048,576 bytes)
    const MAX_SIZE_BYTES = 1 * 1024 * 1024
    if (fileBuffer.length > MAX_SIZE_BYTES) {
      const sizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2)
      return res.status(400).json({
        success: false,
        message: `Image file size (${sizeMB} MB) exceeds the 1MB limit. Maximum allowed size is 1.0 MB.`,
      })
    }

    const staticDir = path.resolve(process.cwd(), "static")
    if (!fs.existsSync(staticDir)) {
      fs.mkdirSync(staticDir, { recursive: true })
    }

    const cleanBaseName = filename 
      ? path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)
      : "banner"

    const uniqueFilename = `banner-${Date.now()}-${cleanBaseName}${ext}`
    const targetPath = path.join(staticDir, uniqueFilename)

    fs.writeFileSync(targetPath, fileBuffer)

    const relativeUrl = `/static/${uniqueFilename}`
    const fullUrl = `https://propremiumcare.com/store-backend/static/${uniqueFilename}`

    return res.json({
      success: true,
      filename: uniqueFilename,
      url: relativeUrl,
      fullUrl,
      message: "Banner image uploaded successfully",
    })
  } catch (error: any) {
    console.error("[CMS Banner Upload] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
