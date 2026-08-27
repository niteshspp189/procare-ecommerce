import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs"

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
    let ext = ".jpg"

    if (dataUrl && typeof dataUrl === "string") {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, message: "Invalid dataUrl format" })
      }
      const mimeType = matches[1]
      fileBuffer = Buffer.from(matches[2], "base64")
      if (mimeType.includes("png")) ext = ".png"
      else if (mimeType.includes("webp")) ext = ".webp"
      else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = ".jpg"
      else if (mimeType.includes("svg")) ext = ".svg"
    } else {
      fileBuffer = Buffer.from(base64, "base64")
      if (filename) {
        const fileExt = path.extname(filename).toLowerCase()
        if (fileExt) ext = fileExt
      }
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
