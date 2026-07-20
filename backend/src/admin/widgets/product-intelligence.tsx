import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Table, Input, Textarea, Button, Badge, toast } from "@medusajs/ui"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useState, useEffect } from "react"

export const config = defineWidgetConfig({
    zone: "product.details.after",
})

const AVAILABLE_BADGES = [
    { label: "Essentials", iconId: "eco", icon: "✓" },
    { label: "Removes callus and dead skin", iconId: "eco", icon: "✓" },
    { label: "Made in Europe", iconId: "award", icon: "🏆" },
    { label: "Comfort", iconId: "leaf", icon: "🌿" },
    { label: "Skin friendly", iconId: "natural", icon: "🌍" },
    { label: "Lightweight", iconId: "eco", icon: "✓" },
    { label: "Free Shipping", iconId: "shipping", icon: "🚚" },
    { label: "15 Day Return", iconId: "return", icon: "🛡️" },
    { label: "Eco Friendly", iconId: "eco", icon: "♻️" },
    { label: "Complete Kit", iconId: "kit", icon: "📦" },

    { label: "PRO CLEAN", iconId: "eco", icon: "✨" },
    { label: "PRO FRESH", iconId: "leaf", icon: "🍃" },
    { label: "PRO CARE", iconId: "thumb", icon: "👍" },
    { label: "PRO SHINE", iconId: "eco", icon: "💎" },
    { label: "PRO Active", iconId: "eco", icon: "🏃" },
    { label: "PRO Accessories", iconId: "eco", icon: "👞" },

    { label: "NON-TOXIC", iconId: "eco", icon: "🌿" },
    { label: "MADE IN INDIA", iconId: "eco", icon: "🇮🇳" },
    { label: "PARABEN FREE", iconId: "eco", icon: "🛡️" },
    { label: "LEATHER SAFE", iconId: "eco", icon: "👞" },
    { label: "SUEDE COMPATIBLE", iconId: "eco", icon: "👟" },
    { label: "Natural Cedar wood", iconId: "eco", icon: "🪵" },
    { label: "Natural lotus wood", iconId: "eco", icon: "🪵" },
    { label: "Geniune horse hair bristles", iconId: "eco", icon: "🐎" },
    { label: "High quality wood", iconId: "leaf", icon: "🪵" },
    { label: "High-quality steel", iconId: "eco", icon: "⚙️" },
    { label: "Premium stainless steel", iconId: "award", icon: "🏆" },
    { label: "Absorbe moisture", iconId: "eco", icon: "💧" },
    { label: "Odour Control", iconId: "eco", icon: "💨" },
    { label: "Prevents creasing", iconId: "eco", icon: "👞" },
    { label: "Travel friendly", iconId: "plane", icon: "✈️" },
    { label: "With cleaning brush", iconId: "eco", icon: "🪥" },
]

const AVAILABLE_ICONS = [
    { value: "eco", label: "Checkmark (eco)" },
    { value: "natural", label: "Globe (natural)" },
    { value: "leaf", label: "Leaf (leaf)" },
    { value: "thumb", label: "Like (thumb)" },
    { value: "award", label: "Trophy (award)" },
    { value: "shipping", label: "Truck (shipping)" },
    { value: "return", label: "Return Shield (return)" },
    { value: "kit", label: "Kit Box (kit)" },
    { value: "star", label: "Star (star)" },
    { value: "refillable", label: "Refill (refillable)" },
    { value: "organic", label: "Organic (organic)" },
    { value: "lock", label: "Lock (lock)" },
    { value: "gift", label: "Gift (gift)" },
]

const PREVIEW_ICON_SVGS: Record<string, string> = {
    shipping:   '<path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    return:     '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
    eco:        '<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>',
    natural:    '<path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
    refillable: '<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>',
    organic:    '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>',
    kit:        '<path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>',
    star:       '<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>',
    award:      '<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/>',
    lock:       '<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>',
    truck:      '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>',
    gift:       '<path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.25 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 119.75 7.5H12m0 0H8.625M12 7.5h3.375m0 0a3 3 0 013 3v1.5M8.625 7.5a3 3 0 00-3 3v1.5m12.75 0h-12m12 0a3 3 0 013 3v1.5m-15.75-3v-1.5m0 4.5v-1.5"/>',
    leaf:       '<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m0 0C7.857 5.25 4.5 8.607 4.5 12.75c0 2.588 1.276 4.875 3.234 6.277A9.015 9.015 0 0012 20.25a9.015 9.015 0 004.266-1.223C18.224 17.625 19.5 15.338 19.5 12.75 19.5 8.607 16.143 5.25 12 5.25z"/>',
    thumb:      '<path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"/>',
}

const getPreviewIconUrl = (label: string, iconId: string) => {
    const norm = (label || "").toLowerCase().trim();
    const id = (iconId || "").toLowerCase().trim();
    if (norm === "pro clean" || norm === "proclean" || id === "pro-clean") {
      return "/images/icons/pro-clean.png";
    } else if (norm === "pro fresh" || norm === "profresh" || id === "pro-fresh") {
      return "/images/icons/pro-fresh.png";
    } else if (norm === "pro care" || norm === "procare" || id === "pro-care") {
      return "/images/icons/pro-care.png";
    } else if (norm === "pro shine" || norm === "proshine" || id === "pro-shine") {
      return "/images/icons/pro-shine.png";
    } else if (norm === "pro color" || norm === "procolor" || id === "pro-color" || id === "pro-color-green") {
      return "/images/icons/pro-color-green.png";
    } else if (norm.includes("european exper") || norm.includes("euro exper") || norm.includes("europe") || norm.includes("euro tech") || id === "european-expertise" || id === "europian-experts") {
      return "/images/icons/europian-experts.png";
    } else if (norm === "color refreshing" || norm === "color refresh" || norm === "colour" || norm.includes("color restore") || id === "color-refreshing") {
      return "/images/icons/color-refreshing.png";
    } else if (norm === "fight fungi" || id === "helps-fight-fungi-and-bacteria") {
      return "/images/icons/helps-fight-fungi-and-bacteria.png";
    } else if (norm.includes("freshness") || id === "long-lasting-freshness") {
      return "/images/icons/long-lasting-freshness.png";
    } else if (norm === "effective clean" || norm === "effective cleaning agent" || id === "effective-clean" || id === "effective-cleaning-agent") {
      return "/images/icons/effective-cleaning-agent.png";
    } else if (norm === "cleaning" || id === "cleaning") {
      return "/images/icons/cleaning.png";
    } else if (norm === "shine" || norm === "natural shine" || id === "shine") {
      return "/images/icons/shine.png";
    } else if (norm.includes("carnauba") || norm.includes("bristles") || norm.includes("steel") || id === "contain-high-quality") {
      return "/images/icons/contain-high-quality.png";
    }
    return null;
}


const ProductIntelligenceWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
    // Quick Price State
    const [variants, setVariants] = useState<any[]>([])
    const [sellPriceMap, setSellPriceMap] = useState<Record<string, number>>({})
    const [mrpMap, setMrpMap] = useState<Record<string, number>>({})
    const [editingMRP, setEditingMRP] = useState<Record<string, string>>({})
    const [editingSell, setEditingSell] = useState<Record<string, string>>({})
    const [loadingPrices, setLoadingPrices] = useState(true)
    const [updatingVariant, setUpdatingVariant] = useState<string | null>(null)

    // Meta Information State
    const [howToUse, setHowToUse] = useState("")
    const [keyBenefits, setKeyBenefits] = useState("")
    const [suitableFor, setSuitableFor] = useState("")
    const [specsText, setSpecsText] = useState("")
    const [selectedBadges, setSelectedBadges] = useState<Array<{ label: string; iconId: string }>>([
        { label: "", iconId: "" },
        { label: "", iconId: "" },
        { label: "", iconId: "" },
        { label: "", iconId: "" }
    ])

    const [loadingMeta, setLoadingMeta] = useState(true)
    const [savingMeta, setSavingMeta] = useState(false)
    const [showInfoModal, setShowInfoModal] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    // Fetch Price & Variant Data
    const fetchPriceData = async () => {
        try {
            setLoadingPrices(true)
            const pRes = await fetch(`/admin/products/${product.id}?fields=*variants,*variants.prices`, { credentials: "include" })
            const pData = await pRes.json()
            const fetchedVariants: any[] = pData.product?.variants || []
            setVariants(fetchedVariants)

            const mPrices: Record<string, number> = {}
            const sPrices: Record<string, number> = {}
            const mEdit: Record<string, string> = {}
            const sEdit: Record<string, string> = {}

            for (const v of fetchedVariants) {
                const inrPrice = v.prices?.find((p: any) => p.currency_code === "inr" && !p.price_list_id)
                if (inrPrice) {
                    const val = parseFloat(inrPrice.amount)
                    mPrices[v.id] = val
                    mEdit[v.id] = String(val)
                }

                const salePrice = v.prices?.find((p: any) => p.currency_code === "inr" && (p.price_list_id === "pl_online_sale" || p.price_list?.id === "pl_online_sale"))
                if (salePrice) {
                    const val = parseFloat(salePrice.amount)
                    sPrices[v.id] = val
                    sEdit[v.id] = String(val)
                } else if (inrPrice) {
                    const val = parseFloat(inrPrice.amount)
                    sPrices[v.id] = val
                    sEdit[v.id] = String(val)
                }
            }

            setMrpMap(mPrices)
            setSellPriceMap(sPrices)
            setEditingMRP(mEdit)
            setEditingSell(sEdit)
        } catch (error) {
            console.error("Error fetching price data:", error)
        } finally {
            setLoadingPrices(false)
        }
    }

    // Fetch Meta Information
    const fetchMetaData = async () => {
        try {
            setLoadingMeta(true)
            const pRes = await fetch(`/admin/products/${product.id}?fields=+metadata`, { credentials: "include" })
            const pData = await pRes.json()
            const meta = pData.product?.metadata || {}

            setHowToUse(typeof meta.how_to_use === "string" ? meta.how_to_use : "")
            setKeyBenefits(typeof meta.key_benefits === "string" ? meta.key_benefits : "")
            setSuitableFor(typeof meta.suitable_for === "string" ? meta.suitable_for : "")

            // Parse Specifications (convert JSON object or string into Key: Value multiline text)
            let formattedSpecsText = ""
            if (meta.product_specifications) {
                let parsedObj = meta.product_specifications
                if (typeof parsedObj === "string") {
                    try { parsedObj = JSON.parse(parsedObj) } catch { parsedObj = null }
                }
                if (typeof parsedObj === "object" && parsedObj !== null && !Array.isArray(parsedObj)) {
                    const lines = Object.entries(parsedObj).map(([k, v]) => `${k}: ${v}`)
                    formattedSpecsText = lines.join("\n")
                } else if (typeof meta.product_specifications === "string") {
                    formattedSpecsText = meta.product_specifications
                }
            }
            if (!formattedSpecsText) {
                formattedSpecsText = "Usage: \nFunction: "
            }
            setSpecsText(formattedSpecsText)

            // Parse Badges (convert array or JSON into badge list prefilled up to 4 items)
            let badgeList: Array<{ label: string; iconId: string }> = [
                { label: "", iconId: "" },
                { label: "", iconId: "" },
                { label: "", iconId: "" },
                { label: "", iconId: "" }
            ]
            if (meta.product_badges) {
                let rawB = meta.product_badges
                if (typeof rawB === "string") {
                    try { rawB = JSON.parse(rawB) } catch { rawB = [] }
                }
                if (Array.isArray(rawB)) {
                    for (let i = 0; i < 4; i++) {
                        if (rawB[i]) {
                            badgeList[i] = {
                                label: typeof rawB[i] === "string" ? rawB[i] : (rawB[i].label || ""),
                                iconId: typeof rawB[i] === "string" ? "" : (rawB[i].iconId || "")
                            }
                        }
                    }
                }
            }
            setSelectedBadges(badgeList)
        } catch (err) {
            console.error("Error fetching metadata:", err)
        } finally {
            setLoadingMeta(false)
        }
    }

    useEffect(() => {
        fetchPriceData()
        fetchMetaData()
    }, [product.id])

    // Save Price Handler
    const handleSaveVariantPrice = async (variantId: string) => {
        setUpdatingVariant(variantId)
        try {
            const mrpVal = editingMRP[variantId] !== undefined ? parseFloat(editingMRP[variantId]) : mrpMap[variantId]
            const sellVal = editingSell[variantId] !== undefined ? parseFloat(editingSell[variantId]) : sellPriceMap[variantId]

            const res = await fetch(`/admin/quick-price-update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    variant_id: variantId,
                    mrp: mrpVal,
                    selling_price: sellVal
                })
            })

            const resData = await res.json()
            if (res.ok && resData.success) {
                toast.success("Prices updated successfully!")
                fetchPriceData()
            } else {
                toast.error(resData.message || "Failed to update prices")
            }
        } catch (err: any) {
            toast.error("An error occurred while updating price")
        } finally {
            setUpdatingVariant(null)
        }
    }

    // Save Meta Handler
    const handleSaveMetadata = async () => {
        setSavingMeta(true)
        try {
            // Reconstruct specifications object from Key: Value multiline text
            const specsObj: Record<string, string> = {}
            if (specsText) {
                specsText.split("\n").forEach((line) => {
                    const colonIndex = line.indexOf(":")
                    if (colonIndex !== -1) {
                        const key = line.substring(0, colonIndex).trim()
                        const val = line.substring(colonIndex + 1).trim()
                        if (key && val) {
                            specsObj[key] = val
                        }
                    }
                })
            }

            // Reconstruct badges array formatted for storefront (filter out empty strings/falsy values)
            const formattedBadges = selectedBadges
                .filter(b => b && b.label && b.label.trim())
                .map(b => ({
                    label: b.label.trim(),
                    iconId: b.iconId ? b.iconId.trim() : "eco" // default to eco (checkmark) if no icon is specified
                }))

            const payloadMeta = {
                how_to_use: howToUse,
                key_benefits: keyBenefits,
                suitable_for: suitableFor,
                product_specifications: specsObj,
                product_badges: formattedBadges
            }

            const res = await fetch(`/admin/quick-meta-update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    product_id: product.id,
                    metadata: payloadMeta
                })
            })

            const resData = await res.json()
            if (res.ok && resData.success) {
                toast.success("Meta Information saved successfully!")
                setLastSaved(new Date())
                fetchMetaData()
            } else {
                toast.error(resData.message || "Failed to update Meta Information")
            }
        } catch (err: any) {
            toast.error("An error occurred while saving Meta Information")
        } finally {
            setSavingMeta(false)
        }
    }

    return (
        <div className="space-y-8">
            {/* ── 1. QUICK MANAGEMENT SECTION ── */}
            <Container className="overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Heading level="h2" className="flex items-center gap-2">
                            Quick Management
                            <a 
                                href={`${window.location.origin}/products/${product.handle}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs font-normal text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-0.5 ml-2"
                            >
                                ({product.title} ↗)
                            </a>
                        </Heading>
                        <Text size="small" className="text-ui-fg-subtle">Update prices and monitor stock without opening menus.</Text>
                    </div>
                    <Badge color="green">Premium Flow</Badge>
                </div>

                {loadingPrices ? (
                    <Text size="small" className="text-ui-fg-muted animate-pulse">Loading variants & prices...</Text>
                ) : (
                    <Table>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell>Variant</Table.HeaderCell>
                                <Table.HeaderCell>SKU</Table.HeaderCell>
                                <Table.HeaderCell>Inventory</Table.HeaderCell>
                                <Table.HeaderCell>MRP (INR)</Table.HeaderCell>
                                <Table.HeaderCell>Selling Price (INR)</Table.HeaderCell>
                                <Table.HeaderCell>Action</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {variants.map((v) => {
                                const isStock = v.inventory_quantity > 0 || v.allow_backorder || v.manage_inventory === false
                                return (
                                    <Table.Row key={v.id}>
                                        <Table.Cell className="font-medium text-ui-fg-base">{v.title}</Table.Cell>
                                        <Table.Cell className="text-ui-fg-subtle">{v.sku || "N/A"}</Table.Cell>
                                        <Table.Cell>
                                            {isStock ? (
                                                <Badge color="green">in stock ({v.inventory_quantity ?? "unlimited"})</Badge>
                                            ) : (
                                                <Badge color="red">out of stock</Badge>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center gap-1 max-w-[140px]">
                                                <span className="text-xs text-gray-500">₹</span>
                                                <Input
                                                    type="number"
                                                    size="small"
                                                    value={editingMRP[v.id] ?? ""}
                                                    onChange={(e) => setEditingMRP({ ...editingMRP, [v.id]: e.target.value })}
                                                />
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center gap-1 max-w-[140px]">
                                                <span className="text-xs text-gray-500">₹</span>
                                                <Input
                                                    type="number"
                                                    size="small"
                                                    value={editingSell[v.id] ?? ""}
                                                    onChange={(e) => setEditingSell({ ...editingSell, [v.id]: e.target.value })}
                                                />
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Button
                                                size="small"
                                                variant="secondary"
                                                isLoading={updatingVariant === v.id}
                                                onClick={() => handleSaveVariantPrice(v.id)}
                                            >
                                                Save Price
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                )
                            })}
                        </Table.Body>
                    </Table>
                )}
            </Container>

            {/* ── 2. META INFORMATION SECTION (Left/Right Layout with Textareas & Custom Controls) ── */}
            <Container className="overflow-hidden border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div>
                            <Heading level="h2" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                Meta Information
                                <a 
                                    href={`${window.location.origin}/products/${product.handle}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs font-normal text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-0.5 ml-2"
                                >
                                    ({product.title} ↗)
                                </a>
                            </Heading>
                            <Text size="small" className="text-ui-fg-subtle">
                                Content Fields, Product Specifications & Storefront Display Badges.
                            </Text>
                        </div>

                        {/* Interactive 'i' Info Tooltip Button */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowInfoModal(!showInfoModal)}
                                onMouseEnter={() => setShowInfoModal(true)}
                                className="w-7 h-7 rounded-full bg-teal-50 border border-[#00bda5]/30 text-[#00bda5] hover:bg-[#00bda5] hover:text-white font-bold text-xs flex items-center justify-center transition-all shadow-xs cursor-pointer"
                                title="Click or hover to view Storefront Tab Mappings"
                            >
                                i
                            </button>

                            {showInfoModal && (
                                <div
                                    onMouseLeave={() => setShowInfoModal(false)}
                                    className="absolute left-0 top-9 z-50 w-80 p-4 bg-white text-black rounded-xl shadow-2xl text-xs space-y-3 border border-gray-200 animate-fade-in"
                                >
                                    <div className="font-bold text-[#00bda5] border-b border-gray-100 pb-1.5 uppercase tracking-wider text-[11px]">
                                        Storefront Tab Mappings
                                    </div>
                                    <ul className="space-y-2 text-gray-700">
                                        <li>
                                            <strong className="text-black font-semibold">Product Description Tab:</strong>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Renders the Product Description + <strong className="text-gray-700">Key Benefits</strong> content list.</p>
                                        </li>
                                        <li>
                                            <strong className="text-black font-semibold">How to Use Tab:</strong>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Renders the <strong className="text-gray-700">How to Use</strong> step-by-step instructions.</p>
                                        </li>
                                        <li>
                                            <strong className="text-black font-semibold">Specifications Tab:</strong>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Renders the <strong className="text-gray-700">Product Specifications</strong> table, merging in the <strong className="text-gray-700">Suitable For</strong> field.</p>
                                        </li>
                                        <li>
                                            <strong className="text-black font-semibold">Product Badges:</strong>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Displays up to 4 highlight badges on cards and product details.</p>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastSaved && (
                            <span className="text-xs text-gray-400 font-mono">
                                Saved: {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <Button
                            size="small"
                            variant="primary"
                            isLoading={savingMeta}
                            onClick={handleSaveMetadata}
                            className="bg-[#00bda5] hover:bg-[#00a38f] text-white font-bold px-5"
                        >
                            Save Meta Information
                        </Button>
                    </div>
                </div>

                {loadingMeta ? (
                    <Text size="small" className="text-ui-fg-muted animate-pulse">Loading Meta Information...</Text>
                ) : (
                    <div className="space-y-8">
                        {/* LEFT COLUMN (Full Width): Generous Textareas for Content Fields */}
                        <div className="space-y-6">
                            {/* How to Use Textarea */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        How to Use <span className="text-gray-400 font-mono">(how_to_use)</span>
                                    </label>
                                    <span className="text-[11px] text-gray-500">Step-by-step usage instructions</span>
                                </div>
                                <Textarea
                                    rows={5}
                                    className="w-full text-xs font-sans bg-gray-50/50 border-gray-200 focus:bg-white transition-colors min-h-[120px]"
                                    value={howToUse}
                                    onChange={(e) => setHowToUse(e.target.value)}
                                    placeholder="e.g. 1. Remove loose dirt. 2. Apply small amount..."
                                />
                            </div>

                            {/* Key Benefits Textarea */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Key Benefits <span className="text-gray-400 font-mono">(key_benefits)</span>
                                    </label>
                                    <span className="text-[11px] text-gray-500">Feature points list for storefront</span>
                                </div>
                                <Textarea
                                    rows={5}
                                    className="w-full text-xs font-sans bg-gray-50/50 border-gray-200 focus:bg-white transition-colors min-h-[120px]"
                                    value={keyBenefits}
                                    onChange={(e) => setKeyBenefits(e.target.value)}
                                    placeholder="e.g. Cleans & protects leather..."
                                />
                            </div>

                            {/* Suitable For Textarea */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Suitable For <span className="text-gray-400 font-mono">(suitable_for)</span>
                                    </label>
                                    <span className="text-[11px] text-gray-500">Compatible shoe materials</span>
                                </div>
                                <Textarea
                                    rows={3}
                                    className="w-full text-xs font-sans bg-gray-50/50 border-gray-200 focus:bg-white transition-colors min-h-[80px]"
                                    value={suitableFor}
                                    onChange={(e) => setSuitableFor(e.target.value)}
                                    placeholder="e.g. Sneakers, Sports Shoes, Smooth Leather Shoes"
                                />
                            </div>

                            {/* Structured Product Specifications (Single Textarea) */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between border-b pb-2 border-gray-100">
                                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block">
                                        Product Specifications <span className="text-gray-400 font-mono">(product_specifications)</span>
                                    </label>
                                    <span className="text-[11px] text-gray-500">Each on separate line in Key: Value format</span>
                                </div>
                                <Textarea
                                    rows={6}
                                    className="w-full text-xs font-sans bg-gray-50/50 border-gray-200 focus:bg-white transition-colors min-h-[140px]"
                                    value={specsText}
                                    onChange={(e) => setSpecsText(e.target.value)}
                                    placeholder="e.g.&#10;Material: Contoured Beech Wood&#10;Usage: Dust Removal, Polishing"
                                />
                            </div>
                        </div>

                        {/* BOTTOM ROW (Full Width): Product Badges & Preset Toggles */}
                        <div className="space-y-6 bg-gray-50/70 p-5 rounded-2xl border border-gray-100 w-full">
                            <div>
                                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-1">
                                    Product Badges <span className="text-gray-400 font-mono">(product_badges)</span>
                                </label>
                                <Text className="text-[11px] text-gray-500 mb-4">
                                    Configure up to 4 badges. Choose a preset or customize the text manually.
                                </Text>

                                {/* 4 Slots for Product Badges (Vertical Rows) */}
                                <div className="space-y-4">
                                    {[0, 1, 2, 3].map((slotIdx) => {
                                        const currentBadge = selectedBadges[slotIdx] || { label: "", iconId: "" }
                                        const currentLabel = currentBadge.label || ""
                                        const currentIcon = currentBadge.iconId || ""

                                        // Find if this is a preset badge
                                        const matchingPreset = AVAILABLE_BADGES.find(
                                            b => b.label.toLowerCase() === currentLabel.toLowerCase()
                                        )
                                        const selectValue = matchingPreset ? matchingPreset.label : (currentLabel ? "custom" : "")

                                        return (
                                            <div key={slotIdx} className="border border-gray-200 rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center gap-4 justify-between shadow-2xs">
                                                <div className="flex items-center justify-between md:w-32 shrink-0">
                                                    <span className="text-[11px] font-bold text-gray-500 uppercase">Badge Slot {slotIdx + 1}</span>
                                                    {currentLabel && (
                                                        <span className="text-[10px] font-bold text-[#00bda5] bg-[#00bda5]/10 px-1.5 py-0.5 rounded ml-2">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1">
                                                    {/* Preset Select Dropdown */}
                                                    <div className="md:col-span-4">
                                                        <select
                                                            className="text-xs border border-gray-300 rounded-md p-1.5 bg-white w-full h-8 cursor-pointer focus:border-[#00bda5] focus:outline-hidden"
                                                            value={selectValue}
                                                            onChange={(e) => {
                                                                const val = e.target.value
                                                                const updated = [...selectedBadges]
                                                                if (val === "custom") {
                                                                    updated[slotIdx] = {
                                                                        label: currentLabel && !matchingPreset ? currentLabel : "Custom Badge",
                                                                        iconId: currentIcon || "eco"
                                                                    }
                                                                } else if (val === "") {
                                                                    updated[slotIdx] = { label: "", iconId: "" }
                                                                } else {
                                                                    const preset = AVAILABLE_BADGES.find(b => b.label === val)
                                                                    updated[slotIdx] = {
                                                                        label: preset ? preset.label : val,
                                                                        iconId: preset ? preset.iconId : "eco"
                                                                    }
                                                                }
                                                                setSelectedBadges(updated)
                                                            }}
                                                        >
                                                            <option value="">-- None (Clear Slot) --</option>
                                                            {AVAILABLE_BADGES.map(b => (
                                                                <option key={b.label} value={b.label}>
                                                                    {b.icon} {b.label}
                                                                </option>
                                                            ))}
                                                            <option value="custom">✍️ Custom text...</option>
                                                        </select>
                                                    </div>

                                                    {/* Manual Text Input */}
                                                    <div className="md:col-span-5">
                                                        <Input
                                                            size="small"
                                                            placeholder="Manual Badge Text..."
                                                            value={currentLabel}
                                                            onChange={(e) => {
                                                                const updated = [...selectedBadges]
                                                                updated[slotIdx] = {
                                                                    label: e.target.value,
                                                                    iconId: currentIcon || "eco"
                                                                }
                                                                setSelectedBadges(updated)
                                                            }}
                                                            className="text-xs h-8 bg-white w-full"
                                                        />
                                                    </div>

                                                    {/* Icon Selector Dropdown */}
                                                    <div className="md:col-span-3">
                                                        <select
                                                            className="text-xs border border-gray-300 rounded-md p-1.5 bg-white w-full h-8 cursor-pointer focus:border-[#00bda5] focus:outline-hidden"
                                                            value={currentIcon || "eco"}
                                                            onChange={(e) => {
                                                                const updated = [...selectedBadges]
                                                                updated[slotIdx] = {
                                                                    label: currentLabel,
                                                                    iconId: e.target.value
                                                                }
                                                                setSelectedBadges(updated)
                                                            }}
                                                        >
                                                            {AVAILABLE_ICONS.map(i => (
                                                                <option key={i.value} value={i.value}>
                                                                    {i.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Storefront Display Card (Dynamic Live Preview) */}
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4 mt-6">
                                <div className="border-b border-gray-100 pb-2">
                                    <Text className="text-[11px] font-bold text-gray-800 uppercase tracking-wider block">Live Storefront Preview</Text>
                                    <Text className="text-[10px] text-gray-500 leading-relaxed">
                                        Changes saved here update storefront product tabs and badge pills instantly.
                                    </Text>
                                </div>
                                <div className="flex justify-between items-center py-4 border-t border-b border-gray-100 w-full gap-2 bg-gray-50/50 px-4 rounded-lg">
                                    {selectedBadges.map((badge, idx) => {
                                        const displayLabel = badge.label?.trim();
                                        if (!displayLabel) return null;

                                        const mappedIconUrl = getPreviewIconUrl(displayLabel, badge.iconId);
                                        const finalIconSource = mappedIconUrl || badge.iconId;
                                        const isImage = Boolean(finalIconSource && (finalIconSource.startsWith("/") || finalIconSource.includes(".")));

                                        return (
                                            <div key={idx} className="text-center flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                                <div className="w-[58px] h-[58px] rounded-full bg-white flex items-center justify-center text-black border border-gray-200 overflow-hidden mx-auto shadow-xs">
                                                    {isImage ? (
                                                        <img src={finalIconSource} alt={displayLabel} className="w-[38px] h-[38px] object-contain" />
                                                    ) : (
                                                        <svg width="24" height="24" className="text-gray-700" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
                                                            dangerouslySetInnerHTML={{ __html: PREVIEW_ICON_SVGS[badge.iconId] || PREVIEW_ICON_SVGS["shipping"] }} />
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-900 tracking-wider uppercase leading-tight">{displayLabel}</span>
                                            </div>
                                        );
                                    })}
                                    {selectedBadges.filter(b => b.label?.trim()).length === 0 && (
                                        <div className="text-center w-full py-2 text-xs text-gray-400 italic">
                                            No active badges configured.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                    <Button
                        size="large"
                        variant="primary"
                        isLoading={savingMeta}
                        onClick={handleSaveMetadata}
                        className="bg-[#00bda5] hover:bg-[#00a38f] text-white font-bold px-8"
                    >
                        Save Meta Information
                    </Button>
                </div>
            </Container>
        </div>
    )
}

export default ProductIntelligenceWidget
