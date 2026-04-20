import { defineMiddlewares } from "@medusajs/medusa"
import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Strips absolute host URLs from image/thumbnail fields,
 * keeping only the path (e.g. /products/image.png).
 */
function stripHostFromImages(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (req.body && typeof req.body === "object") {
    const body = req.body as Record<string, any>

    // Strip host from thumbnail
    if (typeof body.thumbnail === "string" && body.thumbnail.startsWith("http")) {
      try {
        const url = new URL(body.thumbnail)
        body.thumbnail = url.pathname
      } catch {
        // not a valid URL, leave as-is
      }
    }

    // Strip host from images array
    if (Array.isArray(body.images)) {
      body.images = body.images.map((img: any) => {
        if (typeof img === "string" && img.startsWith("http")) {
          try {
            return new URL(img).pathname
          } catch {
            return img
          }
        }
        if (typeof img?.url === "string" && img.url.startsWith("http")) {
          try {
            img.url = new URL(img.url).pathname
          } catch {
            // leave as-is
          }
        }
        return img
      })
    }
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products",
      method: "POST",
      middlewares: [stripHostFromImages],
    },
    {
      matcher: "/admin/products/:id",
      method: "POST",
      middlewares: [stripHostFromImages],
    },
  ],
})
