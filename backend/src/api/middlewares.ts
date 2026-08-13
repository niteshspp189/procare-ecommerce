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

async function preventDeleteForRestrictedAdmin(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (req.method === "DELETE") {
    const actorId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (actorId) {
      try {
        const userService = req.scope.resolve("user") as any
        const user = await userService.retrieveUser(actorId)
        if (
          user &&
          (user.email === "admin@propremiumcare.com" || user.metadata?.no_delete === true)
        ) {
          return res.status(403).json({
            type: "forbidden",
            message: "Delete operations are restricted for this admin account.",
          })
        }
      } catch (err) {
        // Continue if user retrieval fails
      }
    }
  }
  next()
}

async function preventModificationsForViewer(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const actorId = (req as any).auth_context?.actor_id || (req as any).user?.id
    if (actorId) {
      try {
        const userService = req.scope.resolve("user") as any
        const user = await userService.retrieveUser(actorId)
        if (
          user &&
          user.email === "digitalteam@propremiumcare.com"
        ) {
          return res.status(403).json({
            type: "forbidden",
            message: "Action restricted. This account has view-only permissions.",
          })
        }
      } catch (err) {
        // Continue if user retrieval fails
      }
    }
  }
  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/*",
      method: ["POST", "PUT", "PATCH", "DELETE"],
      middlewares: [preventModificationsForViewer],
    },
    {
      matcher: "/admin/*",
      method: "DELETE",
      middlewares: [preventDeleteForRestrictedAdmin],
    },
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
