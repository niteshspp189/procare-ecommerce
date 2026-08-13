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

          // Set up a performant MutationObserver that only checks newly added nodes
          const processNode = (node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              // If the element itself is a target
              if (
                el.matches &&
                el.matches('[role="menuitem"], button, a, [data-radix-collection-item]')
              ) {
                checkAndHide(el);
              }
              // Check its children
              if (el.querySelectorAll) {
                const children = el.querySelectorAll('[role="menuitem"], button, a, [data-radix-collection-item]');
                children.forEach(checkAndHide);
              }
            }
          };

          const checkAndHide = (el: Element) => {
            // Only check immediate text to avoid hiding parent containers
            const text = el.textContent?.trim().toLowerCase() || "";
            if (
              text === "delete" ||
              text === "delete product" ||
              text === "delete order" ||
              text === "delete customer" ||
              text === "delete variant"
            ) {
              (el as HTMLElement).style.setProperty("display", "none", "important");
            }
          };

          // Initial run
          document.querySelectorAll('[role="menuitem"], button, a, [data-radix-collection-item]').forEach(checkAndHide);

          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              mutation.addedNodes.forEach(processNode);
            });
          });
          observer.observe(document.body, { childList: true, subtree: true });
        }

        if (user && user.email === "digitalteam@propremiumcare.com") {
          let viewerStyleEl = document.getElementById("viewer-admin-style")
          if (!viewerStyleEl) {
            viewerStyleEl = document.createElement("style")
            viewerStyleEl.id = "viewer-admin-style"
            // Hide Settings, DB Backup, and external links like Documentation and Changelog
            viewerStyleEl.innerHTML = `
              a[href*="/settings"],
              a[href*="/backup"],
              a[href*="docs.medusajs.com"],
              a[href*="medusajs.com/changelog"] {
                display: none !important;
              }
            `
            document.head.appendChild(viewerStyleEl)
          }
        }
      })
      .catch(() => {})
  }, [])

  return null
}

export default RestrictedAdminGuardWidget
