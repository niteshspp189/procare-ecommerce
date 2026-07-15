import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs"

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { file } = req.params
    // Decode URL-encoded characters (e.g. %20 → space, %2B → +)
    const decodedFile = decodeURIComponent(file as string)
    // Sanitize: prevent directory traversal
    const safeName = path.basename(decodedFile)
    const fullPath = path.resolve(process.cwd(), "static", safeName)

    if (fs.existsSync(fullPath)) {
        return res.sendFile(fullPath)
    }

    return res.status(404).json({ message: "File not found" })
}
