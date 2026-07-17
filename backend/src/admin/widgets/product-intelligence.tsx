import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Table, Input, Textarea, Button, Badge, Switch, toast } from "@medusajs/ui"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useState, useEffect } from "react"

export const config = defineWidgetConfig({
    zone: "product.details.after",
})

const AVAILABLE_BADGES = [
    { label: "PRO CLEAN", icon: "✨" },
    { label: "NON-TOXIC", icon: "🌿" },
    { label: "ECO-FRIENDLY", icon: "♻️" },
    { label: "PREMIUM QUALITY", icon: "🏆" },
    { label: "MADE IN INDIA", icon: "🇮🇳" },
    { label: "PARABEN FREE", icon: "🛡️" },
    { label: "LEATHER SAFE", icon: "👞" },
    { label: "SUEDE COMPATIBLE", icon: "👟" },
]

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
    const [specList, setSpecList] = useState<Array<{ key: string; value: string }>>([])
    const [selectedBadges, setSelectedBadges] = useState<string[]>([])
    const [customBadgeInput, setCustomBadgeInput] = useState("")
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

            // Parse Specifications (convert JSON or string into key-value list)
            const specs: Array<{ key: string; value: string }> = []
            if (meta.product_specifications) {
                let parsedObj = meta.product_specifications
                if (typeof parsedObj === "string") {
                    try { parsedObj = JSON.parse(parsedObj) } catch { parsedObj = null }
                }
                if (typeof parsedObj === "object" && parsedObj !== null && !Array.isArray(parsedObj)) {
                    for (const [k, v] of Object.entries(parsedObj)) {
                        specs.push({ key: k, value: String(v) })
                    }
                } else if (typeof meta.product_specifications === "string") {
                    specs.push({ key: "Specification", value: meta.product_specifications })
                }
            }
            if (specs.length === 0) {
                specs.push({ key: "Usage", value: "" })
                specs.push({ key: "Function", value: "" })
            }
            setSpecList(specs)

            // Parse Badges (convert array or JSON into badge list)
            let badgeList: string[] = []
            if (meta.product_badges) {
                let rawB = meta.product_badges
                if (typeof rawB === "string") {
                    try { rawB = JSON.parse(rawB) } catch { rawB = [rawB] }
                }
                if (Array.isArray(rawB)) {
                    badgeList = rawB.map((b: any) => typeof b === "string" ? b : (b.label || JSON.stringify(b)))
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
            // Reconstruct specifications object
            const specsObj: Record<string, string> = {}
            for (const item of specList) {
                if (item.key.trim() && item.value.trim()) {
                    specsObj[item.key.trim()] = item.value.trim()
                }
            }

            // Reconstruct badges array formatted for storefront
            const formattedBadges = selectedBadges.map(label => ({ label }))

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

    // Badge toggle helper
    const toggleBadge = (label: string) => {
        if (selectedBadges.includes(label)) {
            setSelectedBadges(selectedBadges.filter(b => b !== label))
        } else {
            setSelectedBadges([...selectedBadges, label])
        }
    }

    const addCustomBadge = () => {
        const trimmed = customBadgeInput.trim()
        if (trimmed && !selectedBadges.includes(trimmed)) {
            setSelectedBadges([...selectedBadges, trimmed])
            setCustomBadgeInput("")
        }
    }

    // Spec list helpers
    const updateSpec = (index: number, key: string, value: string) => {
        const updated = [...specList]
        updated[index] = { key, value }
        setSpecList(updated)
    }

    const addSpecRow = () => {
        setSpecList([...specList, { key: "", value: "" }])
    }

    const removeSpecRow = (index: number) => {
        setSpecList(specList.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-8">
            {/* ── 1. QUICK MANAGEMENT SECTION ── */}
            <Container className="overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Heading level="h2">Quick Management</Heading>
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
                            <Heading level="h2" className="text-lg font-bold text-gray-900">Meta Information</Heading>
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
                                    className="absolute left-0 top-9 z-50 w-80 p-4 bg-gray-900 text-white rounded-xl shadow-2xl text-xs space-y-2 border border-gray-700 animate-fade-in"
                                >
                                    <div className="font-bold text-teal-400 border-b border-gray-700 pb-1.5 uppercase tracking-wider text-[11px]">
                                        Storefront Display Mappings
                                    </div>
                                    <ul className="space-y-1.5 text-gray-300">
                                        <li><strong className="text-white">How to Use:</strong> Renders step-by-step instructions tab.</li>
                                        <li><strong className="text-white">Key Benefits:</strong> Renders feature bullet points tab.</li>
                                        <li><strong className="text-white">Suitable For:</strong> Shows materials/shoes compatibility.</li>
                                        <li><strong className="text-white">Specifications:</strong> Renders technical specs key-value table.</li>
                                        <li><strong className="text-white">Product Badges:</strong> Renders eco/quality highlight tags.</li>
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN (2 Cols): Generous Textareas for Content Fields */}
                        <div className="lg:col-span-2 space-y-6">
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

                            {/* Structured Product Specifications (Key-Value Rows) */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between border-b pb-2 border-gray-100">
                                    <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Product Specifications <span className="text-gray-400 font-mono">(product_specifications)</span>
                                    </label>
                                    <Button
                                        size="small"
                                        variant="secondary"
                                        onClick={addSpecRow}
                                        className="text-xs py-0.5 px-2.5"
                                    >
                                        + Add Specification
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {specList.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input
                                                size="small"
                                                placeholder="Key (e.g. Usage)"
                                                value={item.key}
                                                onChange={(e) => updateSpec(idx, e.target.value, item.value)}
                                                className="w-1/3 text-xs"
                                            />
                                            <Input
                                                size="small"
                                                placeholder="Value (e.g. Daily Touch-Up)"
                                                value={item.value}
                                                onChange={(e) => updateSpec(idx, item.key, e.target.value)}
                                                className="w-7/12 text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSpecRow(idx)}
                                                className="text-gray-400 hover:text-red-500 text-sm font-bold px-1"
                                                title="Remove row"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN (1 Col): Product Badges & Preset Toggles */}
                        <div className="space-y-6 bg-gray-50/70 p-5 rounded-2xl border border-gray-100 h-fit">
                            <div>
                                <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-1">
                                    Product Badges <span className="text-gray-400 font-mono">(product_badges)</span>
                                </label>
                                <Text className="text-[11px] text-gray-500 mb-3">Select highlight badges to show on Storefront product cards & details.</Text>

                                {/* Preset Badge Toggles */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                    {AVAILABLE_BADGES.map((badge) => {
                                        const isSelected = selectedBadges.includes(badge.label)
                                        return (
                                            <button
                                                key={badge.label}
                                                type="button"
                                                onClick={() => toggleBadge(badge.label)}
                                                className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold transition-all border text-left cursor-pointer ${
                                                    isSelected
                                                        ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                                                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                                                }`}
                                            >
                                                <span>{badge.icon}</span>
                                                <span className="truncate">{badge.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Custom Badge Input */}
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                    <Input
                                        size="small"
                                        placeholder="Add Custom Badge..."
                                        value={customBadgeInput}
                                        onChange={(e) => setCustomBadgeInput(e.target.value)}
                                        className="text-xs"
                                    />
                                    <Button
                                        size="small"
                                        variant="secondary"
                                        onClick={addCustomBadge}
                                        className="text-xs shrink-0"
                                    >
                                        Add
                                    </Button>
                                </div>

                                {/* Active Badges Summary */}
                                {selectedBadges.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <Text className="text-[10px] font-bold text-gray-500 uppercase mb-2">Active Badges ({selectedBadges.length}):</Text>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedBadges.map((b) => (
                                                <span
                                                    key={b}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00bda5]/15 text-[#00bda5] text-[10px] font-bold border border-[#00bda5]/30"
                                                >
                                                    {b}
                                                    <button type="button" onClick={() => toggleBadge(b)} className="hover:text-red-500">✕</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Storefront Display Card */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-2">
                                <Text className="text-[11px] font-bold text-gray-800 uppercase tracking-wider block">Live Storefront Preview</Text>
                                <Text className="text-[10px] text-gray-500 leading-relaxed">
                                    Changes saved here update storefront product tabs and badge pills instantly.
                                </Text>
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
