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

export default function ProductIntelligenceWidget({ data: product }: { data: any }) {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [colorMapText, setColorMapText] = useState("")

    useEffect(() => {
        if (product?.metadata) {
            setFormData(product.metadata)
            if (product.metadata.color_hex_map) {
                const map = product.metadata.color_hex_map as Record<string, string>
                const text = Object.entries(map).map(([k, v]) => `${k}: ${v}`).join("\n")
                setColorMapText(text)
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

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/admin/products/${product.id}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ metadata: formData }),
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
        <Container className="p-0 overflow-hidden mb-8 border-none shadow-xl bg-white rounded-3xl animate-fade-in">
            <div className="bg-black p-8 text-white flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <Heading level="h2" className="text-2xl font-black uppercase tracking-tight leading-none">Product Intelligence</Heading>
                    <Text className="text-gray-500 text-[9px] font-black uppercase tracking-[0.3em]">Premium Marketing & Technical Controls</Text>
                </div>
                <Button
                    variant="primary"
                    size="small"
                    isLoading={saving}
                    onClick={handleSave}
                    className="bg-white text-black hover:bg-gray-200 rounded-full px-10 h-10 font-black border-none transition-all active:scale-95"
                >
                    {saving ? "SAVING..." : "SAVE CHANGES"}
                </Button>
            </div>

            <div className="p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* LEFT COLUMN: TEXT CONTENT */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4">
                            <div className="w-2.5 h-10 bg-black rounded-full" />
                            <div className="flex flex-col">
                                <Heading level="h3" className="text-base font-black uppercase tracking-widest">Master Specifications</Heading>
                                <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vertical Content Form</Text>
                            </div>
                        </div>

                        {FORM_FIELDS.map((field) => (
                            <div key={field.key} className="flex flex-col gap-3 group">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-focus-within:text-black transition-colors">{field.label}</Label>
                                    <div className="bg-gray-100 px-2 py-0.5 rounded text-[8px] font-mono text-gray-400 uppercase">locked-key</div>
                                </div>
                                {field.type === "textarea" ? (
                                    <Textarea
                                        value={formData[field.key] || ""}
                                        onChange={(e: any) => handleChange(field.key, e.target.value)}
                                        placeholder={`Enter ${field.label.toLowerCase()} content...`}
                                        className="min-h-[160px] bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-black rounded-[2.5rem] p-7 text-sm resize-none transition-all leading-relaxed shadow-inner"
                                    />
                                ) : (
                                    <Input
                                        value={formData[field.key] || ""}
                                        onChange={(e: any) => handleChange(field.key, e.target.value)}
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                        className="bg-gray-50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-black rounded-3xl h-16 px-8 text-sm transition-all shadow-inner font-bold"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* RIGHT COLUMN: SWITCHES & COLOR MAP */}
                    <div className="space-y-16">
                        <div>
                            <div className="flex items-center gap-4 mb-12">
                                <div className="w-2.5 h-10 bg-black rounded-full" />
                                <div className="flex flex-col">
                                    <Heading level="h3" className="text-base font-black uppercase tracking-widest">Brand Logic Toggles</Heading>
                                    <Text className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Icon Visibility Management</Text>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                {FEATURE_ICONS.map((feat) => {
                                    const isActive = formData[feat.key] === "true" || formData[feat.key] === true;
                                    return (
                                        <div
                                            key={feat.key}
                                            className={clx(
                                                "flex items-center justify-between p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer shadow-sm active:scale-95",
                                                isActive
                                                    ? "bg-black border-black text-white shadow-2xl"
                                                    : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200"
                                            )}
                                            onClick={() => handleChange(feat.key, !isActive)}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className={clx(
                                                    "text-[10px] font-black uppercase tracking-[0.2em]",
                                                    isActive ? "text-white" : "text-black"
                                                )}>{feat.label}</span>
                                                <span className="text-[8px] opacity-60 font-black uppercase tracking-widest">{isActive ? "Visible" : "Hidden"}</span>
                                            </div>
                                            <Switch
                                                checked={isActive}
                                                onCheckedChange={(checked) => handleChange(feat.key, checked)}
                                                className="data-[state=checked]:bg-white"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* COLOR MAP SECTION */}
                        <div className="p-10 bg-black rounded-[3.5rem] text-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-2.5 h-10 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                                <div className="flex flex-col">
                                    <Heading level="h3" className="text-base font-black uppercase tracking-widest">Variant Color Palette</Heading>
                                    <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Hex Mapping System</Text>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 block mb-2">Instructions</Label>
                                    <Text className="text-[8px] text-gray-400 uppercase font-black leading-relaxed italic">
                                        Enter mappings line by line. Example:<br />
                                        <span className="text-white">Midnight Blue: #191970</span><br />
                                        <span className="text-white">Forest Green: #228B22</span>
                                    </Text>
                                </div>
                                <Textarea
                                    value={colorMapText}
                                    onChange={(e: any) => handleColorMapChange(e.target.value)}
                                    placeholder="Variant: #Hex&#10;Color: #Code"
                                    className="min-h-[160px] bg-white/5 border-white/10 focus:bg-white/10 focus:ring-0 rounded-3xl p-7 text-sm font-mono text-white resize-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-[3.5rem] p-10 border border-dashed border-gray-200">
                            <div className="flex items-center justify-between mb-8">
                                <Heading level="h3" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Sync Status</Heading>
                                <div className={clx(
                                    "w-2 h-2 rounded-full animate-pulse",
                                    saving ? "bg-amber-400" : "bg-green-400"
                                )} />
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Last Modified</span>
                                    <span className="font-mono text-black font-black">{lastSaved ? lastSaved.toLocaleTimeString() : "PENDING SYNC"}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Active Elements</span>
                                    <span className="font-mono text-black font-black">{Object.keys(formData).length} Items</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-black text-gray-400 uppercase tracking-widest">Deployment State</span>
                                    <span className={clx(
                                        "px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest",
                                        saving ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700 shadow-sm"
                                    )}>{saving ? "TRANSMITTING" : "SYNCHRONIZED"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    )
}
