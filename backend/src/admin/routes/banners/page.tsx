import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  Table,
  Badge,
  Input,
  Label,
  Switch,
  toast,
} from "@medusajs/ui"
import {
  Photo,
  ArrowPath,
  PencilSquare,
  ArrowUpRightOnBox,
  CheckCircleSolid,
  XCircleSolid,
  LaptopMobile,
} from "@medusajs/icons"
import { useState, useEffect, useRef } from "react"

interface Banner {
  id: string
  title: string
  type: string
  desktop_image_url: string
  mobile_image_url?: string | null
  link_url: string
  alt_text?: string | null
  is_active: boolean
  display_order: number
  created_at?: string
  updated_at?: string
}

const BannersCMSPage = () => {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [activeTypeTab, setActiveTypeTab] = useState<string>("all")

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form Fields
  const [formTitle, setFormTitle] = useState("")
  const [formType, setFormType] = useState("hero")
  const [formDesktopUrl, setFormDesktopUrl] = useState("")
  const [formMobileUrl, setFormMobileUrl] = useState("")
  const [formLinkUrl, setFormLinkUrl] = useState("/shop")
  const [formAltText, setFormAltText] = useState("")
  const [formIsActive, setFormIsActive] = useState(true)
  const [formDisplayOrder, setFormDisplayOrder] = useState(0)

  // Uploading state
  const [isUploadingDesktop, setIsUploadingDesktop] = useState(false)
  const [isUploadingMobile, setIsUploadingMobile] = useState(false)

  const desktopFileInputRef = useRef<HTMLInputElement>(null)
  const mobileFileInputRef = useRef<HTMLInputElement>(null)

  const fetchBanners = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/admin/custom/banners", { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setBanners(data.banners || [])
      } else {
        toast.error(data.message || "Failed to load banners")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Network error loading banners")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormTitle(banner.title)
    setFormType(banner.type)
    setFormDesktopUrl(banner.desktop_image_url)
    setFormMobileUrl(banner.mobile_image_url || "")
    setFormLinkUrl(banner.link_url || "/shop")
    setFormAltText(banner.alt_text || "")
    setFormIsActive(banner.is_active)
    setFormDisplayOrder(banner.display_order)
    setIsFormOpen(true)
  }

  const handleFileUpload = async (
    file: File,
    target: "desktop" | "mobile"
  ) => {
    const isDesktop = target === "desktop"
    if (isDesktop) setIsUploadingDesktop(true)
    else setIsUploadingMobile(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        if (!dataUrl) {
          toast.error("Failed to read image file")
          if (isDesktop) setIsUploadingDesktop(false)
          else setIsUploadingMobile(false)
          return
        }

        const res = await fetch("/admin/custom/banners/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, dataUrl }),
          credentials: "include",
        })
        const data = await res.json()

        if (data.success && data.url) {
          if (isDesktop) {
            setFormDesktopUrl(data.url)
            toast.success("Desktop image uploaded successfully!")
          } else {
            setFormMobileUrl(data.url)
            toast.success("Mobile image uploaded successfully!")
          }
        } else {
          toast.error(data.message || "Upload failed")
        }

        if (isDesktop) setIsUploadingDesktop(false)
        else setIsUploadingMobile(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Image upload failed")
      if (isDesktop) setIsUploadingDesktop(false)
      else setIsUploadingMobile(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error("Media title is required")
      return
    }
    if (!formDesktopUrl.trim()) {
      toast.error("Desktop image is required")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: formTitle.trim(),
        type: formType,
        desktop_image_url: formDesktopUrl.trim(),
        mobile_image_url: formMobileUrl.trim() || null,
        link_url: formLinkUrl.trim() || "/shop",
        alt_text: formAltText.trim() || formTitle.trim(),
        is_active: formIsActive,
        display_order: Number(formDisplayOrder) || 0,
      }

      let res
      if (editingBanner) {
        res = await fetch(`/admin/custom/banners/${editingBanner.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        })
      } else {
        res = await fetch("/admin/custom/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        })
      }

      const data = await res.json()
      if (data.success) {
        toast.success("Media slot updated successfully")
        setIsFormOpen(false)
        await fetchBanners()
      } else {
        toast.error(data.message || "Failed to update media")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Network error updating media")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (banner: Banner) => {
    try {
      const res = await fetch(`/admin/custom/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !banner.is_active }),
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Media slot is now ${!banner.is_active ? "Active" : "Inactive"}`)
        await fetchBanners()
      } else {
        toast.error(data.message || "Failed to update status")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error updating status")
    }
  }

  const filteredBanners = banners.filter(
    (b) => activeTypeTab === "all" || b.type === activeTypeTab
  )

  const activeHeroBanners = banners.filter((b) => b.is_active && b.type === "hero")
  const primaryBanner = activeHeroBanners[0] || banners[0]

  const typeTabs = [
    { id: "all", label: "All Media", count: banners.length },
    { id: "hero", label: "Homepage Hero", count: banners.filter((b) => b.type === "hero").length },
    { id: "category_card", label: "Homepage 4 Cards", count: banners.filter((b) => b.type === "category_card").length },
    { id: "category_banner", label: "Category Headers", count: banners.filter((b) => b.type === "category_banner").length },
    { id: "story_hero", label: "Our Story Hero", count: banners.filter((b) => b.type === "story_hero").length },
    { id: "story_card", label: "Our Story 4 Cards", count: banners.filter((b) => b.type === "story_card").length },
    { id: "story_wide_banner", label: "Our Story Wide Banner", count: banners.filter((b) => b.type === "story_wide_banner").length },
  ]

  return (
    <div className="flex flex-col gap-y-6 pb-12">
      {/* Header Container */}
      <Container className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Photo className="w-6 h-6 text-ui-fg-base" />
              <Heading level="h1" className="text-xl font-bold">
                Banner & Media CMS
              </Heading>
            </div>
            <Text className="text-ui-fg-muted text-sm">
              Update and manage media for all 15 fixed slots across Homepage, Category Pages, and Our Story.
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={fetchBanners}
              className="flex items-center gap-1.5"
            >
              <ArrowPath className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Container>

      {/* Live Preview Panel */}
      {primaryBanner && (
        <Container className="p-6 bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Heading level="h2" className="text-sm font-semibold text-gray-900">
                Live Storefront Preview: {primaryBanner.title}
              </Heading>
              <Text className="text-xs text-gray-500">
                Type: <span className="font-semibold uppercase">{primaryBanner.type}</span> | Target Link: <span className="font-mono text-gray-700">{primaryBanner.link_url}</span>
              </Text>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  previewMode === "desktop"
                    ? "bg-gray-900 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Desktop (Wide)
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${
                  previewMode === "mobile"
                    ? "bg-gray-900 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <LaptopMobile className="w-3.5 h-3.5" />
                Mobile
              </button>
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="flex justify-center bg-gray-900/5 p-4 rounded-xl border border-dashed border-gray-300">
            {previewMode === "desktop" ? (
              <div className="w-full max-w-4xl bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-gray-500 ml-2 font-mono">propremiumcare.com</span>
                </div>
                <img
                  src={primaryBanner.desktop_image_url}
                  alt={primaryBanner.alt_text || primaryBanner.title}
                  className="w-full h-auto object-cover max-h-[360px]"
                />
              </div>
            ) : (
              <div className="w-[320px] bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-gray-800">
                <div className="bg-gray-800 text-white text-[10px] py-1 px-3 flex justify-between items-center">
                  <span>9:41</span>
                  <span>5G 100%</span>
                </div>
                <img
                  src={primaryBanner.mobile_image_url || primaryBanner.desktop_image_url}
                  alt={primaryBanner.alt_text || primaryBanner.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        </Container>
      )}

      {/* Banner List Table with Type Filter Tabs */}
      <Container className="p-0 overflow-hidden">
        <div className="p-4 border-b border-ui-border-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Heading level="h2" className="text-base font-semibold">
            Storefront Media Slots ({filteredBanners.length})
          </Heading>

          {/* Type Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
            {typeTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTypeTab(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTypeTab === tab.id
                    ? "bg-white text-gray-900 shadow-2xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Media Slot</Table.HeaderCell>
                <Table.HeaderCell>Placement</Table.HeaderCell>
                <Table.HeaderCell>Target Link</Table.HeaderCell>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <Table.Cell className="text-center py-12 text-ui-fg-muted">
                    Loading media slots...
                  </Table.Cell>
                </Table.Row>
              ) : filteredBanners.length === 0 ? (
                <Table.Row>
                  <Table.Cell className="text-center py-12 text-ui-fg-muted">
                    No media slots found in this category.
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredBanners.map((b) => (
                  <Table.Row key={b.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <img
                          src={b.desktop_image_url}
                          alt={b.title}
                          className="w-16 h-10 object-cover rounded border border-gray-200 bg-gray-50 shrink-0"
                        />
                        <div>
                          <Text className="font-semibold text-sm text-ui-fg-base">{b.title}</Text>
                          <Text className="text-xs text-ui-fg-muted font-mono truncate max-w-[240px]">
                            {b.desktop_image_url}
                          </Text>
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge
                        size="small"
                        color={
                          b.type === "hero"
                            ? "blue"
                            : b.type === "category_card"
                            ? "purple"
                            : b.type === "category_banner"
                            ? "orange"
                            : b.type === "story_hero"
                            ? "green"
                            : b.type === "story_card"
                            ? "blue"
                            : b.type === "story_wide_banner"
                            ? "orange"
                            : "grey"
                        }
                      >
                        {b.type === "hero"
                          ? "HOMEPAGE HERO"
                          : b.type === "category_card"
                          ? "HOMEPAGE CARD"
                          : b.type === "category_banner"
                          ? "CATEGORY HEADER"
                          : b.type === "story_hero"
                          ? "STORY HERO"
                          : b.type === "story_card"
                          ? "STORY CARD"
                          : b.type === "story_wide_banner"
                          ? "STORY WIDE BANNER"
                          : b.type.toUpperCase()}
                      </Badge>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        <Text className="text-xs font-mono text-ui-fg-subtle">{b.link_url}</Text>
                        <ArrowUpRightOnBox className="w-3 h-3 text-ui-fg-muted" />
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <Text className="text-xs font-mono font-medium">#{b.display_order}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      <button
                        onClick={() => handleToggleActive(b)}
                        className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                      >
                        {b.is_active ? (
                          <Badge size="small" color="green" className="flex items-center gap-1">
                            <CheckCircleSolid className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge size="small" color="grey" className="flex items-center gap-1">
                            <XCircleSolid className="w-3 h-3" />
                            Inactive
                          </Badge>
                        )}
                      </button>
                    </Table.Cell>

                    <Table.Cell className="text-right">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleOpenEdit(b)}
                        className="inline-flex items-center gap-1 font-medium"
                      >
                        <PencilSquare className="w-3.5 h-3.5" />
                        Edit / Replace
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </Container>

      {/* Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <Heading level="h2" className="text-lg font-bold text-gray-900">
                  Edit Media: {formTitle}
                </Heading>
                <Text className="text-xs text-gray-500">
                  Update images, target redirection link, and display options for this fixed UI slot.
                </Text>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Title & Placement Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 block mb-1">Slot Name *</Label>
                  <Input
                    placeholder="e.g. Shoe Care - Category Card"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700 block mb-1">UI Placement</Label>
                  <div className="h-8 px-3 flex items-center text-xs bg-gray-100 text-gray-700 font-semibold rounded-md border border-gray-200 uppercase">
                    {formType.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              {/* Desktop Banner Uploader */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-gray-900">
                    Desktop Image * (Recommended: 1920x600 for Hero, 800x900 for Cards)
                  </Label>
                  <input
                    type="file"
                    ref={desktopFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "desktop")
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    isLoading={isUploadingDesktop}
                    onClick={() => desktopFileInputRef.current?.click()}
                  >
                    Upload Image
                  </Button>
                </div>

                <Input
                  placeholder="Image URL or upload above"
                  value={formDesktopUrl}
                  onChange={(e) => setFormDesktopUrl(e.target.value)}
                  required
                  className="font-mono text-xs mb-2"
                />

                {formDesktopUrl && (
                  <div className="mt-2 rounded overflow-hidden border border-gray-300 bg-white p-1">
                    <img src={formDesktopUrl} alt="Desktop Preview" className="w-full h-28 object-cover rounded" />
                  </div>
                )}
              </div>

              {/* Mobile Banner Uploader */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-gray-900">
                    Mobile Image (Optional, falls back to desktop image)
                  </Label>
                  <input
                    type="file"
                    ref={mobileFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "mobile")
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    isLoading={isUploadingMobile}
                    onClick={() => mobileFileInputRef.current?.click()}
                  >
                    Upload Image
                  </Button>
                </div>

                <Input
                  placeholder="Mobile Image URL (optional)"
                  value={formMobileUrl}
                  onChange={(e) => setFormMobileUrl(e.target.value)}
                  className="font-mono text-xs mb-2"
                />

                {formMobileUrl && (
                  <div className="mt-2 rounded overflow-hidden border border-gray-300 bg-white p-1 max-w-[160px]">
                    <img src={formMobileUrl} alt="Mobile Preview" className="w-full h-24 object-cover rounded" />
                  </div>
                )}
              </div>

              {/* Link URL & Presets */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 block mb-1">Target Redirection Link</Label>
                <Input
                  placeholder="/shop or /categories/shoe-care"
                  value={formLinkUrl}
                  onChange={(e) => setFormLinkUrl(e.target.value)}
                  className="font-mono text-xs mb-2"
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-[11px] text-gray-500 self-center mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setFormLinkUrl("/shop")}
                    className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-gray-200 rounded border text-gray-700 cursor-pointer"
                  >
                    /shop
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLinkUrl("/categories/shoe-care")}
                    className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-gray-200 rounded border text-gray-700 cursor-pointer"
                  >
                    /categories/shoe-care
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLinkUrl("/categories/insoles")}
                    className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-gray-200 rounded border text-gray-700 cursor-pointer"
                  >
                    /categories/insoles
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLinkUrl("/categories/foot-care")}
                    className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-gray-200 rounded border text-gray-700 cursor-pointer"
                  >
                    /categories/foot-care
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormLinkUrl("/categories/accessories")}
                    className="px-2 py-0.5 text-[11px] bg-gray-100 hover:bg-gray-200 rounded border text-gray-700 cursor-pointer"
                  >
                    /categories/accessories
                  </button>
                </div>
              </div>

              {/* SEO Alt Text & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 block mb-1">Alt Text (SEO)</Label>
                  <Input
                    placeholder="e.g. Shop Premium Shoe Care Creams"
                    value={formAltText}
                    onChange={(e) => setFormAltText(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700 block mb-1">Display Order (0 = First)</Label>
                  <Input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <Text className="text-xs font-semibold text-gray-900">Active Visibility</Text>
                  <Text className="text-[11px] text-gray-500">Show this banner on the live storefront</Text>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSaving} className="bg-black text-white hover:bg-gray-800">
                  {editingBanner ? "Save Changes" : "Create Banner"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Banner CMS",
  icon: Photo,
})

export default BannersCMSPage
