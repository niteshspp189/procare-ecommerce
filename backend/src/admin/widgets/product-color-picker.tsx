import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState, useEffect, useRef } from "react"
import { Container, Heading, Text } from "@medusajs/ui"

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default function ColorPickerWidget({ data: product }: { data: any }) {
  const [colors, setColors] = useState<Record<string, string>>({})
  const [saveState, setSaveState] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({})
  const [colorValues, setColorValues] = useState<string[]>([])
  const [status, setStatus] = useState("loading")
  const productIdRef = useRef<string>("")
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!product?.id) return
    productIdRef.current = product.id
    fetch(`/admin/products/${product.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.product
        if (!p) { setStatus("error: no product"); return }
        const map: Record<string, string> = (p?.metadata?.color_hex_map as Record<string, string>) || {}
        setColors(map)
        const colorOpt = (p?.options ?? []).find((o: any) => o.title?.toLowerCase() === "color")
        const vals: string[] = Array.from(new Set(((colorOpt?.values ?? []) as any[]).map((v: any) => String(v.value))))
        setColorValues(vals)
        const states: Record<string, "idle" | "saving" | "saved" | "error"> = {}
        vals.forEach((v) => { states[v] = "idle" })
        setSaveState(states)
        setStatus(vals.length ? "ok" : "no-color-option")
      })
      .catch((e: any) => setStatus("error: " + e.message))
  }, [product?.id])

  const handleColorChange = (colorName: string, hex: string) => {
    setColors((c) => ({ ...c, [colorName]: hex }))
    setSaveState((s) => ({ ...s, [colorName]: "saving" }))
    clearTimeout(debounceTimers.current[colorName])
    debounceTimers.current[colorName] = setTimeout(async () => {
      try {
        const updatedMap = { ...colors, [colorName]: hex }
        const res = await fetch(`/admin/products/${productIdRef.current}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: { color_hex_map: updatedMap } }),
        })
        if (!res.ok) throw new Error(await res.text())
        setColors(updatedMap)
        setSaveState((s) => ({ ...s, [colorName]: "saved" }))
        setTimeout(() => setSaveState((s) => ({ ...s, [colorName]: "idle" })), 2000)
      } catch {
        setSaveState((s) => ({ ...s, [colorName]: "error" }))
      }
    }, 800)
  }

  if (status === "loading" || status === "no-color-option" || status.startsWith("error")) {
    return (
      <Container className="p-4 mb-4">
        <Heading level="h2" className="text-sm font-semibold mb-1">🎨 Variant Colors</Heading>
        <Text className={`text-xs ${status.startsWith("error") ? "text-red-500" : "text-gray-500"}`}>
          {status === "loading" ? "Loading..." : status === "no-color-option" ? "No 'Color' option found on this product." : status}
        </Text>
      </Container>
    )
  }

  return (
    <Container className="p-4 mb-4">
      <Heading level="h2" className="text-sm font-semibold mb-3">🎨 Variant Colors</Heading>
      <div className="flex flex-col gap-2">
        {colorValues.map((colorName) => {
          const hex = colors[colorName] || "#888888"
          const state = saveState[colorName] || "idle"
          const statusLabel = state === "saving" ? "Saving…" : state === "saved" ? "✓ Saved" : state === "error" ? "✗ Error" : ""
          const statusColor = state === "saved" ? "text-green-600" : state === "error" ? "text-red-500" : "text-gray-400"

          return (
            <div key={colorName} className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
              <input
                type="color"
                value={hex}
                onChange={(e) => handleColorChange(colorName, e.target.value)}
                className="w-8 h-7 p-0 cursor-pointer border rounded"
              />
              <span className="font-semibold text-xs flex-1">{colorName}</span>
              <input
                type="text"
                value={hex}
                maxLength={7}
                onChange={(e) => {
                  const v = e.target.value
                  setColors((c) => ({ ...c, [colorName]: v }))
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) handleColorChange(colorName, v)
                }}
                className="w-20 p-1 text-xs font-mono border rounded uppercase bg-white"
              />
              {statusLabel && <span className={`text-xs ${statusColor} min-w-[50px] text-right`}>{statusLabel}</span>}
            </div>
          )
        })}
      </div>
    </Container>
  )
}
