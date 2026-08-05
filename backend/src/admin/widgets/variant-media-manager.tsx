import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"

export const config = defineWidgetConfig({
  zone: "product_variant.details.after",
})

export default function VariantMediaManagerWidget({ data: variant }: { data: any }) {
  const [images, setImages] = useState<Array<{ id: string; url: string }>>([])
  const [productImages, setProductImages] = useState<Array<{ id: string; url: string }>>([])
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSingleVariant, setIsSingleVariant] = useState(false)
  const [hasMultipleVariants, setHasMultipleVariants] = useState(false)

  const variantId = variant?.id
  const productId = variant?.product_id || variant?.product?.id || (typeof window !== "undefined" ? window.location.pathname.split("/products/")[1]?.split("/")[0] : null)

  const fetchVariantImages = async () => {
    if (!variantId) return
    setFetching(true)
    try {
      const res = await fetch(`/admin/products/${productId}?fields=*variants,+variants.metadata,*images`, { credentials: "include" })
      const data = await res.json()
      const p = data?.product
      if (!p) return

      const pImgs = (p.images || []).map((i: any) => ({ id: i.id, url: i.url }))
      setProductImages(pImgs)
      
      const pVariants = p.variants || []
      if (pVariants.length <= 1) {
        setIsSingleVariant(true)
      } else {
        setHasMultipleVariants(true)
      }

      const v = pVariants.find((vItem: any) => vItem.id === variantId)
      const meta = v?.metadata || {}
      
      const vImgs: Array<{ id: string; url: string }> = []
      const seen = new Set<string>()

      if (meta.thumbnail && !seen.has(meta.thumbnail)) {
        vImgs.push({ id: `thumb`, url: meta.thumbnail })
        seen.add(meta.thumbnail)
      }

      for (let i = 1; i <= 10; i++) {
        const u = meta[`image_${i}`]
        if (u && !seen.has(u)) {
          vImgs.push({ id: `img_${i}`, url: u })
          seen.add(u)
        }
      }

      setImages(vImgs)
    } catch (e: any) {
      console.error("Error fetching variant images:", e)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchVariantImages()
  }, [variantId])

  // Hide the native media widget
  useEffect(() => {
    if (hasMultipleVariants) {
      const hideNativeMedia = () => {
        const headings = Array.from(document.querySelectorAll('h2'))
        headings.forEach(h => {
          if (h.textContent?.trim() === "Media" && !h.textContent.includes("Smooth")) {
            // Find the closest container card and hide it
            let curr: HTMLElement | null = h
            for (let i = 0; i < 5; i++) {
              if (curr && curr.classList.contains("bg-white")) {
                curr.style.display = "none"
                return
              }
              if (curr) curr = curr.parentElement
            }
            // Fallback: hide parent's parent if bg-white not found
            if (h.parentElement?.parentElement) {
              h.parentElement.parentElement.style.display = "none"
            }
          }
        })
      }
      
      hideNativeMedia()
      const t1 = setTimeout(hideNativeMedia, 100)
      const t2 = setTimeout(hideNativeMedia, 500)
      const t3 = setTimeout(hideNativeMedia, 1500)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
  }, [hasMultipleVariants, fetching, images])

  // Smooth Drag & Drop with Drop Target Highlight
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    // Transparent drag ghost image for smooth dragging
    const ghost = document.createElement("div")
    ghost.style.width = "0px"
    ghost.style.height = "0px"
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    setTimeout(() => document.body.removeChild(ghost), 0)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (draggedIndex !== index && dropTargetIndex !== index) {
      setDropTargetIndex(index)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDropTargetIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDropTargetIndex(null)
      return
    }

    const updated = [...images]
    const [moved] = updated.splice(draggedIndex, 1)
    updated.splice(targetIndex, 0, moved)
    setImages(updated)
    setDraggedIndex(null)
    setDropTargetIndex(null)
  }

  const moveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return
    const updated = [...images]
    const [moved] = updated.splice(index, 1)
    updated.splice(targetIndex, 0, moved)
    setImages(updated)
  }

  const setAsThumbnail = (index: number) => {
    if (index === 0) return
    const updated = [...images]
    const [moved] = updated.splice(index, 1)
    updated.unshift(moved)
    setImages(updated)
    toast.success("Set as primary thumbnail")
  }

  const removeImage = (index: number) => {
    if (window.confirm("Are you sure you want to remove this image from the variant?")) {
      const updated = images.filter((_, i) => i !== index)
      setImages(updated)
    }
  }

  const addImageToVariant = (url: string) => {
    if (images.some(img => img.url === url)) {
      toast.error("Image already added to variant")
      return
    }
    setImages([...images, { id: `new_${Date.now()}`, url }])
    toast.success("Image added to variant gallery")
  }

  const handleSaveOrder = async () => {
    setSaving(true)
    try {
      const metaUpdate: Record<string, string> = {}
      if (images.length > 0) {
        metaUpdate["thumbnail"] = images[0].url
        images.forEach((img, idx) => {
          metaUpdate[`image_${idx + 1}`] = img.url
        })
      }

      const res = await fetch(`/admin/quick-variant-media-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          variant_id: variantId,
          product_id: productId,
          image_urls: images.map(i => i.url),
          metadata: metaUpdate
        })
      })

      const resData = await res.json()
      if (res.ok && resData.success) {
        toast.success("Variant image order saved successfully!")
        fetchVariantImages()
      } else {
        toast.error(resData.message || "Failed to save variant images")
      }
    } catch (err: any) {
      toast.error("Error saving variant images")
    } finally {
      setSaving(false)
    }
  }

  if (isSingleVariant) {
    return null;
  }

  return (
    <Container className="p-5 mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm select-none">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <Heading level="h2" className="text-base font-bold text-gray-900 flex items-center gap-2">
            📸 Smooth Variant Gallery (Drag & Drop Reordering)
          </Heading>
          <Text size="small" className="text-gray-500">
            Smooth drag-and-drop or click arrows to re-order images. The 1st image is used as the primary thumbnail.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" variant="transparent" onClick={fetchVariantImages} title="Refresh Images from Database">
            🔄 Refresh
          </Button>
          <Button size="small" variant="secondary" onClick={() => setShowAddModal(true)}>
            + Add Product Images
          </Button>
          <Button
            size="small"
            variant="primary"
            isLoading={saving}
            onClick={handleSaveOrder}
            className="bg-[#00bda5] hover:bg-[#00a38f] text-white font-bold"
          >
            Save Image Order
          </Button>
        </div>
      </div>

      {fetching ? (
        <div className="p-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 h-[200px]">
          <div className="w-8 h-8 border-4 border-[#00bda5] border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="font-semibold text-gray-500">Loading variant images...</span>
        </div>
      ) : images.length === 0 ? (
        <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          No images assigned to this variant yet. Click "+ Add Product Images" to select.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map((img, idx) => {
            const isDragging = draggedIndex === idx
            const isDropTarget = dropTargetIndex === idx && draggedIndex !== idx

            return (
              <div
                key={img.url + idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, idx)}
                className={`relative group bg-gray-50 border rounded-xl overflow-hidden p-2 transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
                  isDragging ? "opacity-30 scale-95 border-dashed border-teal-400" : ""
                } ${
                  isDropTarget ? "border-[#00bda5] ring-2 ring-[#00bda5]/40 scale-102 bg-teal-50/50" : "border-gray-200 hover:border-teal-300"
                } ${idx === 0 && !isDragging ? "ring-2 ring-[#00bda5]/20 border-[#00bda5]" : ""}`}
              >
                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-[#00bda5] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs z-10">
                    Thumbnail
                  </span>
                )}

                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white mb-2 shadow-2xs">
                  <img
                    src={img.url}
                    loading="lazy"
                    alt={`Variant Image ${idx + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveImage(idx, "left")}
                    className="px-1.5 py-0.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-teal-50 hover:text-teal-700 rounded disabled:opacity-25 cursor-pointer transition-colors"
                    title="Move Left"
                  >
                    ←
                  </button>

                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => setAsThumbnail(idx)}
                      className="px-1 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded cursor-pointer transition-colors"
                      title="Set as Primary Thumbnail"
                    >
                      ★
                    </button>
                  )}

                  <span className="text-[10px] font-mono font-bold text-gray-400">#{idx + 1}</span>

                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => moveImage(idx, "right")}
                    className="px-1.5 py-0.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-teal-50 hover:text-teal-700 rounded disabled:opacity-25 cursor-pointer transition-colors"
                    title="Move Right"
                  >
                    →
                  </button>

                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="px-1.5 py-0.5 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded cursor-pointer transition-colors"
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Product Images Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h3 className="font-bold text-base text-gray-900">Select Images from Product Gallery</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 mb-6">
              {productImages.map((pImg) => {
                const isSelected = images.some(i => i.url === pImg.url)
                return (
                  <div
                    key={pImg.id}
                    onClick={() => addImageToVariant(pImg.url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all ${
                      isSelected ? "border-teal-500 ring-2 ring-teal-500/30 opacity-60" : "border-gray-200 hover:border-teal-400"
                    }`}
                  >
                    <img src={pImg.url} className="w-full h-full object-cover" />
                    {isSelected && (
                      <span className="absolute inset-0 bg-teal-600/40 text-white font-bold text-xs flex items-center justify-center">
                        ✓ Added
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end">
              <Button size="small" variant="secondary" onClick={() => setShowAddModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
