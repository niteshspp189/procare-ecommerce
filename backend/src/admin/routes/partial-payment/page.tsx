import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  Badge,
  Input,
  Label,
  Switch,
  toast,
} from "@medusajs/ui"
import {
  CreditCard,
  ArrowPath,
} from "@medusajs/icons"
import { useState, useEffect } from "react"

const PartialPaymentAdminPage = () => {
  const [isEnabled, setIsEnabled] = useState(true)
  const [percentage, setPercentage] = useState(15)
  const [minOrderValue, setMinOrderValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/admin/custom/partial-payment", { credentials: "include" })
      const data = await res.json()
      if (data.success && data.config) {
        setIsEnabled(Boolean(data.config.enabled))
        setPercentage(Number(data.config.percentage) || 15)
        setMinOrderValue(Number(data.config.min_order_value) || 0)
      }
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Failed to load partial payment settings")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch("/admin/custom/partial-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: isEnabled,
          percentage: Number(percentage),
          min_order_value: Number(minOrderValue),
        }),
        credentials: "include",
      })

      const data = await res.json()
      if (data.success) {
        toast.success("Partial payment settings saved successfully!")
      } else {
        toast.error(data.message || "Failed to save settings")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error saving partial payment settings")
    } finally {
      setIsSaving(false)
    }
  }

  const sampleCartTotal = 1000
  const sampleAdvance = Math.round((sampleCartTotal * percentage) / 100)
  const sampleBalance = sampleCartTotal - sampleAdvance

  return (
    <div className="flex flex-col gap-y-6 pb-12">
      {/* Header Container */}
      <Container className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <CreditCard className="w-6 h-6 text-ui-fg-base" />
              <Heading level="h1" className="text-xl font-bold">
                Partial Payment (Partial COD) Configuration
              </Heading>
            </div>
            <Text className="text-ui-fg-muted text-sm">
              Allow customers to pay a small advance online (10% or 15%) via Razorpay, with the remaining balance collected as COD on doorstep delivery.
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={fetchSettings}
              className="flex items-center gap-1.5"
            >
              <ArrowPath className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Container>

      {/* Main Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Box */}
        <Container className="p-6 lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Feature Status Toggle */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <Label className="text-sm font-bold text-gray-900 block mb-0.5">
                  Enable Partial COD at Storefront Checkout
                </Label>
                <span className="text-xs text-gray-500">
                  When enabled, customers can choose Partial COD alongside standard full online payment.
                </span>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>

            {/* Advance Percentage Selector & Custom Overwrite */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700 block">
                  Advance Online Deposit Percentage *
                </Label>
                <span className="text-xs font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200">
                  Active: {percentage}%
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[10, 15, 20, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPercentage(pct)}
                    className={`py-2.5 px-4 rounded-xl border text-center transition-all cursor-pointer ${
                      percentage === pct
                        ? "bg-black text-white border-black shadow-md font-bold"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 font-medium"
                    }`}
                  >
                    <span className="text-base block font-mono">{pct}%</span>
                    <span className="text-[10px] opacity-80 block">Quick Preset</span>
                  </button>
                ))}
              </div>

              {/* Custom Overwrite Percentage Input */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-800 block">
                    Custom Percentage Overwrite (%)
                  </Label>
                  <Text className="text-[11px] text-gray-500">
                    Type any custom advance deposit percentage (1% to 99%) or click a quick preset above.
                  </Text>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={percentage}
                      onChange={(e) => {
                        const val = Math.min(99, Math.max(1, Number(e.target.value) || 1))
                        setPercentage(val)
                      }}
                      className="w-24 font-mono font-bold text-sm pr-6 text-center"
                    />
                    <span className="absolute right-2.5 text-xs font-bold text-gray-400 pointer-events-none">
                      %
                    </span>
                  </div>
                  {![10, 15, 20, 25].includes(percentage) && (
                    <Badge color="orange" size="small" className="font-semibold text-[10px]">
                      Custom Active
                    </Badge>
                  )}
                </div>
              </div>

              <span className="text-[11px] text-gray-500 block">
                Recommended: <strong>10%</strong> or <strong>15%</strong>. This amount acts as a non-refundable deposit to secure courier transit.
              </span>
            </div>

            {/* Minimum Order Value */}
            <div>
              <Label className="text-xs font-semibold text-gray-700 block mb-1">
                Minimum Cart Amount for Partial COD (₹)
              </Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(Number(e.target.value) || 0)}
                placeholder="0"
                className="max-w-xs font-mono text-xs"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Set to 0 to enable for all orders regardless of cart value.
              </span>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                className="bg-black hover:bg-gray-800 text-white font-semibold"
              >
                Save Partial Payment Settings
              </Button>
            </div>
          </form>
        </Container>

        {/* Live Customer Preview Card */}
        <Container className="p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Customer Checkout Preview
              </span>
              {isEnabled ? (
                <Badge size="small" color="green">Active</Badge>
              ) : (
                <Badge size="small" color="red">Disabled</Badge>
              )}
            </div>

            {/* Mock Checkout Option Box */}
            <div className={`p-4 rounded-xl border-2 transition-all ${isEnabled ? "border-emerald-500 bg-emerald-50/30" : "border-gray-200 opacity-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  Partial COD ({percentage}% Online)
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Pay a small {percentage}% deposit online to confirm dispatch. Pay remaining balance at your doorstep.
              </p>

              {/* Breakdown Table */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Sample Order Total:</span>
                  <span className="font-mono">₹{sampleCartTotal}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-gray-100">
                  <span>Pay Now ({percentage}% Advance):</span>
                  <span className="font-mono">₹{sampleAdvance}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Collect on Delivery (COD):</span>
                  <span className="font-mono">₹{sampleBalance}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900">
              <span className="font-bold">📦 Logistics Sync:</span>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Shiprocket order will automatically be generated with <strong>payment_method: COD</strong> and courier collection amount set to <strong>₹{sampleBalance}</strong>.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
            Razorpay Test & Live Credentials Ready
          </div>
        </Container>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Partial Payment",
  icon: CreditCard,
})

export default PartialPaymentAdminPage
