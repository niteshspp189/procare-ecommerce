import { defineWidgetConfig } from "@medusajs/admin-sdk"
import React, { useState, useEffect, useRef } from "react"

function ColorPickerWidget({ data: product }: { data: any }) {
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
    setColors((c: Record<string,string>) => ({ ...c, [colorName]: hex }))
    setSaveState((s: Record<string,"idle"|"saving"|"saved"|"error">) => ({ ...s, [colorName]: "saving" }))
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
        setSaveState((s: Record<string,"idle"|"saving"|"saved"|"error">) => ({ ...s, [colorName]: "saved" }))
        setTimeout(() => setSaveState((s: Record<string,"idle"|"saving"|"saved"|"error">) => ({ ...s, [colorName]: "idle" })), 2000)
      } catch {
        setSaveState((s: Record<string,"idle"|"saving"|"saved"|"error">) => ({ ...s, [colorName]: "error" }))
      }
    }, 800)
  }

  const containerStyle = { padding: "16px", background: "#fff" }
  const headerStyle = { fontSize: "14px", fontWeight: "600" as const, marginBottom: "4px", color: "#0f172a" }
  const subStyle = { fontSize: "12px", color: "#64748b", marginBottom: "12px", marginTop: "2px" }

  if (status === "loading") return React.createElement("div", { style: containerStyle },
    React.createElement("div", { style: headerStyle }, "🎨 Variant Colors"),
    React.createElement("p", { style: subStyle }, "Loading...")
  )

  if (status === "no-color-option") return React.createElement("div", { style: containerStyle },
    React.createElement("div", { style: headerStyle }, "🎨 Variant Colors"),
    React.createElement("p", { style: subStyle }, "No 'Color' option found on this product.")
  )

  if (status.startsWith("error")) return React.createElement("div", { style: containerStyle },
    React.createElement("div", { style: headerStyle }, "🎨 Variant Colors"),
    React.createElement("p", { style: { ...subStyle, color: "#ef4444" } }, status)
  )

  return React.createElement(
    "div", { style: containerStyle },
    React.createElement("div", { style: headerStyle }, "🎨 Variant Colors"),
    ...colorValues.map((colorName: string) => {
      const hex = colors[colorName] || "#888888"
      const state = saveState[colorName] || "idle"
      const statusLabel = state === "saving" ? "Saving…" : state === "saved" ? "✓ Saved" : state === "error" ? "✗ Error" : ""
      const statusColor = state === "saved" ? "#16a34a" : state === "error" ? "#ef4444" : "#94a3b8"

      return React.createElement(
        "div",
        { key: colorName, style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" } },
        React.createElement("input", {
          type: "color",
          value: hex,
          onChange: (e: any) => handleColorChange(colorName, e.target.value),
          style: { width: "32px", height: "28px", padding: "1px", border: "1px solid #cbd5e1", borderRadius: "5px", cursor: "pointer", flexShrink: 0 },
        }),
        React.createElement("span", { style: { fontWeight: "600" as const, fontSize: "13px", flex: 1 } }, colorName),
        React.createElement("input", {
          type: "text",
          value: hex,
          maxLength: 7,
          onChange: (e: any) => {
            const v = e.target.value
            setColors((c: Record<string,string>) => ({ ...c, [colorName]: v }))
            if (/^#[0-9a-fA-F]{6}$/.test(v)) handleColorChange(colorName, v)
          },
          style: { width: "80px", padding: "4px 6px", fontSize: "11px", fontFamily: "monospace", border: "1px solid #cbd5e1", borderRadius: "5px", background: "#fff", textTransform: "uppercase" as const },
        }),
        statusLabel && React.createElement("span", { style: { fontSize: "11px", color: statusColor, flexShrink: 0 } }, statusLabel)
      )
    })
  )
}

export default ColorPickerWidget

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})
