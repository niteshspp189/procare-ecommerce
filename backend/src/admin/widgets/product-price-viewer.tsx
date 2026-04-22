import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"

export const config = defineWidgetConfig({
    zone: "product.details.before",
})

export default function VariantTableDOMInjector({ data }: any) {
    const [variants, setVariants] = useState<any[]>([])
    const productId = data?.id

    useEffect(() => {
        if (!productId) return
        fetch(`/admin/products/${productId}?fields=*variants,*variants.prices`, {
            credentials: "include",
        })
            .then((res) => res.json())
            .then((resData) => {
                setVariants(resData.product?.variants || [])
            })
            .catch(console.error)
    }, [productId])

    useEffect(() => {
        if (variants.length === 0) return

        const formatPrice = (amount: number) => {
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
            }).format(amount)
        }

        const interval = setInterval(() => {
            // Find all tables on the page
            const tables = document.querySelectorAll("table")
            let targetTable: HTMLTableElement | null = null

            for (let i = 0; i < tables.length; i++) {
                const text = tables[i].textContent?.toLowerCase() || ""
                // The variants table usually has "sku" and "inventory" headers
                if (text.includes("sku") && text.includes("inventory")) {
                    targetTable = tables[i]
                    break
                }
            }

            if (!targetTable) return

            // Check if already injected
            if (targetTable.getAttribute("data-price-injected") === "true") return

            const firstHeaderRow = targetTable.querySelector("thead tr")
            if (!firstHeaderRow) return

            // Wait until it actually has children (meaning it rendered)
            if (firstHeaderRow.children.length < 3) return

            targetTable.setAttribute("data-price-injected", "true")

            // Inject Header right before the "Inventory" or last normal column
            const headerCells = firstHeaderRow.querySelectorAll("th")
            let injectIndex = headerCells.length - 1 // Default to second to last (before the ... menu)

            // Try to find the Inventory column index
            headerCells.forEach((th, index) => {
                if (th.textContent?.toLowerCase().includes("inventory")) {
                    injectIndex = index
                }
            })

            const baseThClass = headerCells[1]?.className || ""

            const newTh = document.createElement("th")
            newTh.className = baseThClass
            newTh.innerHTML = `<div class="flex items-center"><span class="text-xs font-medium text-ui-fg-subtle truncate pr-6">PRICE (INR)</span></div>`
            firstHeaderRow.insertBefore(newTh, firstHeaderRow.children[injectIndex])

            // Process Rows
            const tbody = targetTable.querySelector("tbody")
            if (tbody) {
                const rows = tbody.querySelectorAll("tr")
                rows.forEach((row) => {
                    const cells = row.querySelectorAll("td")
                    if (cells.length < 3) return

                    const baseTdClass = cells[1]?.className || ""

                    // Extract the Variant Title (usually in the first or second column)
                    let variantTitle = ""
                    cells.forEach(cell => {
                        if (!variantTitle) {
                            const text = cell.innerText.trim()
                            if (text && !text.includes("\n")) variantTitle = text
                        }
                    })

                    // The most reliable way is matching sequentially, the first non-empty text string is usually the title.
                    // Or match by SKU if available
                    let match = null

                    // Try to match by SKU if present in any of the cells
                    for (const cell of Array.from(cells)) {
                        const cellText = cell.innerText.trim()
                        const found = variants.find(v => v.sku === cellText || cellText.includes(v.sku))
                        if (found) {
                            match = found
                            break
                        }
                    }

                    // Fallback to title matching if no SKU matched
                    if (!match) {
                        for (const cell of Array.from(cells)) {
                            const cellText = cell.innerText.trim()
                            const found = variants.find(v => v.title === cellText)
                            if (found) {
                                match = found
                                break
                            }
                        }
                    }

                    const inrPrice = match?.prices?.find((p: any) => p.currency_code === "inr")?.amount
                    const priceText = inrPrice !== undefined ? formatPrice(inrPrice) : "-"

                    const newTd = document.createElement("td")
                    newTd.className = baseTdClass
                    newTd.style.verticalAlign = "middle"

                    // Emulate exact styling with right padding
                    newTd.innerHTML = `<div class="flex h-full items-center"><span class="truncate text-sm text-ui-fg-subtle pr-6">${priceText}</span></div>`

                    row.insertBefore(newTd, row.children[injectIndex])
                })
            }

        }, 1000)

        return () => clearInterval(interval)
    }, [variants])

    return null
}
