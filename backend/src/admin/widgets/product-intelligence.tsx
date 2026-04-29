import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Input, Textarea, Switch, Label, Button, clx } from "@medusajs/ui"
import { useState, useEffect } from "react"

export const config = defineWidgetConfig({
    zone: "product.details.after",
})

const FORM_FIELDS = [
    { key: "how_to_use", label: "How to Use", type: "textarea" },
    { key: "ingredients", label: "Key Ingredients", type: "textarea" },
    { key: "key_benefits", label: "Key Benefits", type: "textarea" },
    { key: "suitable_for", label: "Suitable For", type: "textarea" },
    { key: "formula", label: "Formula", type: "text" },
    { key: "includes", label: "Includes", type: "text" },
    { key: "safety", label: "Safety Info", type: "text" },
]

const FEATURE_ICONS = [
    { key: "is_natural", label: "Natural" },
    { key: "is_refillable", label: "Refillable" },
    { key: "is_eco", label: "Eco Friendly" },
    { key: "is_organic", label: "Organic" },
]

// All available icons for the badge picker
export const ICON_OPTIONS = [
    { id: "shipping",   label: "Free Shipping",   svg: '<path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round"/>' },
    { id: "return",     label: "30 Day Return",   svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>' },
    { id: "eco",        label: "Eco Friendly",    svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>' },
    { id: "natural",    label: "Natural",         svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' },
    { id: "refillable", label: "Refillable",      svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>' },
    { id: "organic",    label: "Organic",         svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>' },
    { id: "kit",        label: "Complete Kit",    svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>' },
    { id: "star",       label: "Top Rated",       svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>' },
    { id: "award",      label: "Award Winning",   svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/>' },
    { id: "lock",       label: "Secure",          svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>' },
    { id: "truck",      label: "Fast Delivery",   svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>' },
    { id: "gift",       label: "Gift Ready",      svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.25 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 119.75 7.5H12m0 0H8.625M12 7.5h3.375m0 0a3 3 0 013 3v1.5M8.625 7.5a3 3 0 00-3 3v1.5m12.75 0h-12m12 0a3 3 0 013 3v1.5m-15.75-3v-1.5m0 4.5v-1.5"/>' },
    { id: "leaf",       label: "Sustainable",     svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 0C7.857 5.25 4.5 8.607 4.5 12.75c0 2.588 1.276 4.875 3.234 6.277A9.015 9.015 0 0012 20.25a9.015 9.015 0 004.266-1.223C18.224 17.625 19.5 15.338 19.5 12.75 19.5 8.607 16.143 5.25 12 5.25z"/>' },
    { id: "thumb",      label: "Guaranteed",      svg: '<path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"/>' },
]

const DEFAULT_BADGES = [
    { iconId: "shipping", label: "Free Shipping" },
    { iconId: "return",   label: "30 Day Return" },
    { iconId: "eco",      label: "Eco Friendly" },
    { iconId: "kit",      label: "Complete Kit" },
]

type Badge = { iconId: string; label: string }

export default function ProductIntelligenceWidget({ data: product }: { data: any }) {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [colorMapText, setColorMapText] = useState("")
    const [badges, setBadges] = useState<Badge[]>(DEFAULT_BADGES)

    useEffect(() => {
        if (product?.metadata) {
            setFormData(product.metadata)
            if (product.metadata.color_hex_map) {
                const map = product.metadata.color_hex_map as Record<string, string>
                const text = Object.entries(map).map(([k, v]) => `${k}: ${v}`).join("\n")
                setColorMapText(text)
            }
            if (product.metadata.product_badges) {
                try {
                    const parsed = typeof product.metadata.product_badges === "string"
                        ? JSON.parse(product.metadata.product_badges)
                        : product.metadata.product_badges
                    if (Array.isArray(parsed) && parsed.length === 4) setBadges(parsed)
                } catch {}
            }
        }
    }, [product])

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }))
    }

    const handleColorMapChange = (text: string) => {
        setColorMapText(text)
        const newMap: Record<string, string> = {}
        text.split("\n").forEach(line => {
            const [key, val] = line.split(":").map(s => s.trim())
            if (key && val) newMap[key] = val
        })
        setFormData((prev: any) => ({ ...prev, color_hex_map: newMap }))
    }

    const updateBadge = (index: number, field: keyof Badge, value: string) => {
        setBadges(prev => {
            const next = [...prev]
            next[index] = { ...next[index], [field]: field === "label" ? value.slice(0, 16) : value }
            if (field === "iconId") {
                const preset = ICON_OPTIONS.find(o => o.id === value)
                if (preset && !next[index].label) next[index].label = preset.label.slice(0, 16)
                else if (preset) next[index].label = next[index].label // keep custom label
            }
            return next
        })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/admin/products/${product.id}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ metadata: { ...formData, product_badges: badges } }),
            })
            if (!res.ok) throw new Error("Failed to save")
            setLastSaved(new Date())
        } catch (err) {
            console.error(err)
            alert("Error saving metadata")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Container className="p-0 overflow-hidden mb-8 border border-ui-border-base shadow-sm bg-ui-bg-base rounded-2xl animate-fade-in">
            <div className="bg-ui-bg-subtle border-b border-ui-border-base px-8 py-5">
                <Heading level="h2" className="text-lg font-semibold text-ui-fg-base">Meta Information</Heading>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* LEFT COLUMN: TEXT CONTENT */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-1 h-6 bg-ui-fg-muted rounded-full" />
                            <Heading level="h3" className="text-sm font-semibold text-ui-fg-subtle uppercase tracking-widest">Content Fields</Heading>
                        </div>

                        {FORM_FIELDS.map((field) => (
                            <div key={field.key} className="flex flex-col gap-2 group">
                                <Label className="text-xs font-medium text-ui-fg-muted uppercase tracking-wide">{field.label}</Label>
                                {field.type === "textarea" ? (
                                    <Textarea
                                        value={formData[field.key] || ""}
                                        onChange={(e: any) => handleChange(field.key, e.target.value)}
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                        className="min-h-[120px] bg-ui-bg-field border-ui-border-base focus:border-ui-border-interactive rounded-lg p-3 text-sm resize-none transition-all leading-relaxed"
                                    />
                                ) : (
                                    <Input
                                        value={formData[field.key] || ""}
                                        onChange={(e: any) => handleChange(field.key, e.target.value)}
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                        className="bg-ui-bg-field border-ui-border-base focus:border-ui-border-interactive rounded-lg h-10 px-3 text-sm transition-all"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* RIGHT COLUMN: BADGE PICKER & COLOR MAP */}
                    <div className="space-y-16">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-6 bg-ui-fg-muted rounded-full" />
                                <Heading level="h3" className="text-sm font-semibold text-ui-fg-subtle uppercase tracking-widest">Feature Badges</Heading>
                                <Text className="text-[10px] text-ui-fg-muted ml-auto">Always 4 shown · max 16 chars</Text>
                            </div>
                            <div className="flex flex-col gap-4">
                                {badges.map((badge, i) => {
                                    const selected = ICON_OPTIONS.find(o => o.id === badge.iconId)
                                    return (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-ui-border-base bg-ui-bg-component">
                                            {/* Icon preview */}
                                            <div className="w-9 h-9 rounded-full bg-ui-bg-subtle border border-ui-border-base flex items-center justify-center shrink-0">
                                                {selected && (
                                                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
                                                        dangerouslySetInnerHTML={{ __html: selected.svg }} />
                                                )}
                                            </div>
                                            {/* Icon selector */}
                                            <select
                                                value={badge.iconId}
                                                onChange={e => updateBadge(i, "iconId", e.target.value)}
                                                className="flex-1 text-xs border border-ui-border-base rounded-md h-8 px-2 bg-ui-bg-field text-ui-fg-base focus:outline-none focus:border-ui-border-interactive"
                                            >
                                                {ICON_OPTIONS.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                ))}
                                            </select>
                                            {/* Label input */}
                                            <div className="relative flex-1">
                                                <Input
                                                    value={badge.label}
                                                    onChange={(e: any) => updateBadge(i, "label", e.target.value)}
                                                    placeholder="Label..."
                                                    maxLength={16}
                                                    className="h-8 text-xs px-2 pr-8 border-ui-border-base rounded-md w-full"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-ui-fg-muted pointer-events-none">
                                                    {badge.label.length}/16
                                                </span>
                                            </div>
                                            {/* Reset slot to default */}
                                            <button
                                                type="button"
                                                onClick={() => setBadges(prev => { const n = [...prev]; n[i] = DEFAULT_BADGES[i]; return n })}
                                                title="Reset to default"
                                                className="text-ui-fg-muted hover:text-ui-fg-subtle text-xs shrink-0"
                                            >↺</button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* COLOR MAP SECTION */}
                        <div className="p-6 bg-ui-bg-subtle rounded-xl border border-ui-border-base">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-6 bg-ui-fg-muted rounded-full" />
                                <Heading level="h3" className="text-sm font-semibold text-ui-fg-subtle uppercase tracking-widest">Variant Color Palette</Heading>
                            </div>
                            <div className="space-y-3">
                                <Text className="text-xs text-ui-fg-muted">Enter one mapping per line: <span className="font-mono text-ui-fg-subtle">Color Name: #HexCode</span></Text>
                                <Textarea
                                    value={colorMapText}
                                    onChange={(e: any) => handleColorMapChange(e.target.value)}
                                    placeholder={"Midnight Blue: #191970\nForest Green: #228B22"}
                                    className="min-h-[120px] bg-ui-bg-field border-ui-border-base focus:border-ui-border-interactive rounded-lg p-3 text-sm font-mono resize-none transition-all"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* SAVE BUTTON */}
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-ui-border-base">
                    <Text className="text-xs text-ui-fg-muted">
                        {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : "Unsaved changes"}
                    </Text>
                    <Button
                        variant="primary"
                        size="base"
                        isLoading={saving}
                        onClick={handleSave}
                        className="px-8"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </Container>
    )
}
