import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useState, useEffect, useRef } from "react"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== "string") return null
  const trimmed = urlOrId.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

export default function ProductYoutubeWidget({ data: product }: { data: any }) {
  const [videos, setVideos] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [loading, setLoading] = useState(true)
  const productIdRef = useRef<string>("")
  const currentMetadataRef = useRef<Record<string, any>>({})

  useEffect(() => {
    if (!product?.id) return
    productIdRef.current = product.id

    fetch(`/admin/products/${product.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.product
        if (p?.metadata) {
          currentMetadataRef.current = p.metadata
          const rawVideos = p.metadata.youtube_videos
          if (Array.isArray(rawVideos)) {
            const list = rawVideos
              .map((item) => (typeof item === "string" ? item : item?.url || item?.id))
              .filter(Boolean)
            setVideos(list.slice(0, 3))
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error fetching product for youtube widget:", err)
        setLoading(false)
      })
  }, [product?.id])

  const saveVideosToProduct = async (updatedList: string[]) => {
    setSaveStatus("saving")
    try {
      const payloadMetadata = {
        ...currentMetadataRef.current,
        youtube_videos: updatedList,
      }

      const res = await fetch(`/admin/products/${productIdRef.current}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: payloadMetadata }),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      currentMetadataRef.current = payloadMetadata
      setVideos(updatedList)
      setSaveStatus("saved")
      toast.success("Saved", { description: "Product YouTube videos updated successfully" })
      setTimeout(() => setSaveStatus("idle"), 2500)
    } catch (err: any) {
      console.error("Failed to save youtube videos:", err)
      setSaveStatus("error")
      toast.error("Save Failed", { description: err.message || "Failed to update product" })
      setTimeout(() => setSaveStatus("idle"), 3500)
    }
  }

  const handleAddVideo = () => {
    const id = extractYouTubeId(newUrl)
    if (!id) {
      toast.error("Invalid URL", { description: "Please enter a valid YouTube video or Shorts URL" })
      return
    }

    if (videos.length >= 3) {
      toast.error("Limit Reached", { description: "Maximum 3 videos allowed per product" })
      return
    }

    const cleanUrl = newUrl.trim()
    const updated = [...videos, cleanUrl]
    setNewUrl("")
    saveVideosToProduct(updated)
  }

  const handleRemoveVideo = (index: number) => {
    const updated = videos.filter((_, i) => i !== index)
    saveVideosToProduct(updated)
  }

  const previewId = extractYouTubeId(newUrl)

  return (
    <Container className="p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <Heading level="h2" className="text-sm font-semibold flex items-center gap-1.5">
          <span>🎬</span> Product Videos (YouTube)
        </Heading>
        <span className="text-[11px] font-semibold text-ui-fg-muted bg-ui-bg-subtle px-2 py-0.5 rounded-full">
          {videos.length}/3 Max
        </span>
      </div>

      <Text className="text-xs text-ui-fg-subtle mb-3">
        YouTube video URLs display as playable video slides in the storefront gallery after product images.
      </Text>

      {loading ? (
        <Text className="text-xs text-ui-fg-muted">Loading video settings...</Text>
      ) : (
        <div className="flex flex-col gap-3">
          {/* List of existing videos */}
          {videos.length > 0 && (
            <div className="flex flex-col gap-2">
              {videos.map((vidUrl, index) => {
                const vidId = extractYouTubeId(vidUrl)
                const thumbUrl = vidId ? `https://img.youtube.com/vi/${vidId}/mqdefault.jpg` : null

                return (
                  <div
                    key={index}
                    className="flex items-center gap-2.5 p-2 bg-ui-bg-subtle border border-ui-border-base rounded-lg group"
                  >
                    {/* Thumbnail preview */}
                    <div className="relative w-14 h-10 rounded overflow-hidden bg-black shrink-0 border border-ui-border-base flex items-center justify-center">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={`Video ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[9px] text-white">Video</span>
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>

                    {/* Video info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-ui-fg-base">#{index + 1}</span>
                        {vidId && (
                          <span className="text-[10px] text-ui-fg-muted font-mono truncate">
                            ID: {vidId}
                          </span>
                        )}
                      </div>
                      <a
                        href={vidUrl.startsWith("http") ? vidUrl : `https://www.youtube.com/watch?v=${vidUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline truncate block"
                      >
                        {vidUrl}
                      </a>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(index)}
                      className="p-1 text-ui-fg-muted hover:text-red-600 transition-colors rounded hover:bg-ui-bg-base"
                      title="Remove video"
                      disabled={saveStatus === "saving"}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add Video Form (if less than 3) */}
          {videos.length < 3 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-ui-border-base">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste YouTube or Shorts URL..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-ui-border-base rounded bg-ui-bg-field text-ui-fg-base focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
                  disabled={saveStatus === "saving"}
                />
                <Button
                  size="small"
                  variant="secondary"
                  onClick={handleAddVideo}
                  disabled={!newUrl.trim() || !previewId || saveStatus === "saving"}
                >
                  Add
                </Button>
              </div>

              {/* Live Preview of URL being typed */}
              {newUrl.trim() && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-ui-bg-subtle text-[11px]">
                  {previewId ? (
                    <>
                      <span className="text-emerald-600 font-bold">✓ Valid ID: {previewId}</span>
                      <img
                        src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
                        alt="Preview"
                        className="w-8 h-6 rounded object-cover ml-auto border"
                      />
                    </>
                  ) : (
                    <span className="text-amber-600">Enter a valid YouTube URL (e.g. youtu.be/... or watch?v=...)</span>
                  )}
                </div>
              )}
            </div>
          )}

          {saveStatus === "saving" && (
            <Text className="text-[11px] text-ui-fg-muted animate-pulse">Saving changes...</Text>
          )}
        </div>
      )}
    </Container>
  )
}
