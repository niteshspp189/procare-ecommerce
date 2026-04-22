import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import path from "path"
import fs from "fs"

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { file } = req.params
    const fullPath = path.resolve(process.cwd(), "static", file as string)

    if (fs.existsSync(fullPath)) {
        return res.sendFile(fullPath)
    }

    return res.status(404).json({ message: "File not found" })
}
