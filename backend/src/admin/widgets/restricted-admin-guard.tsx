import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

export const config = defineWidgetConfig({
  zone: [
    "product.list.before",
    "product.details.before",
    "order.list.before",
    "order.details.before",
    "customer.list.before",
    "customer.details.before",
  ],
})

const RestrictedAdminGuardWidget = () => {
  useEffect(() => {
    fetch("/admin/users/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const user = data.user || data
        if (
          user &&
          (user.email === "admin@propremiumcare.com" || user.metadata?.no_delete === true)
        ) {
          // Add global CSS rules to hide delete elements
          let styleEl = document.getElementById("restricted-admin-delete-style")
          if (!styleEl) {
            styleEl = document.createElement("style")
            styleEl.id = "restricted-admin-delete-style"
            styleEl.innerHTML = `
              .text-red-600,
              .text-ui-fg-error,
              [data-testid*="delete"],
              button[aria-label*="delete" i],
              button[aria-label*="Delete" i] {
                /* Handled dynamically by MutationObserver */
              }
            `
            document.head.appendChild(styleEl)
          }

          // Set up MutationObserver to hide any button or menuitem with text "Delete"
          const hideDeleteElements = () => {
            const elements = document.querySelectorAll(
              '[role="menuitem"], button, a, div[data-state], [data-radix-collection-item]'
            )
            elements.forEach((el) => {
              const text = el.textContent?.trim().toLowerCase()
              if (
                text === "delete" ||
                text?.includes("delete product") ||
                text?.includes("delete order") ||
                text?.includes("delete customer") ||
                text?.includes("delete variant")
              ) {
                (el as HTMLElement).style.setProperty("display", "none", "important")
              }
            })
          }

          hideDeleteElements()
          const observer = new MutationObserver(hideDeleteElements)
          observer.observe(document.body, { childList: true, subtree: true })
        }
      })
      .catch(() => {})
  }, [])

  return null
}

export default RestrictedAdminGuardWidget
