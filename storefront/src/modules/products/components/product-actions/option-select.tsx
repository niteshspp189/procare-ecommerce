import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"
import { isGenuineOption } from "@lib/util/product"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  colorHexMap?: Record<string, string>
  product?: HttpTypes.StoreProduct
  "data-testid"?: string
}

const defaultColorHexMap: Record<string, string> = {
  "dark": "#1e293b",
  "light": "#f8fafc",
  "black": "#0f172a",
  "white": "#ffffff",
  "neutral": "#e2e8f0",
  "brown": "#78350f",
  "dark brown": "#451a03",
  "light brown": "#b45309",
  "medium brown": "#92400e",
  "tan": "#d97706",
  "blue": "#1e3a8a",
  "cognac": "#7c2d12",
  "mahogany": "#3b0764",
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  colorHexMap,
  product,
}) => {
  const isColorOption = title.toLowerCase() === "color"
  const isSizeOption = title.toLowerCase().includes("size") || title.toLowerCase() === "sizes"

  if (!isGenuineOption(option, product)) {
    return null
  }

  const filteredOptions = React.useMemo(() => {
    const vals = (option.values ?? []).map((v) => v.value)
    if (!isSizeOption) return vals

    const sizeWeights: Record<string, number> = {
      "xs": 1, "s": 2, "m": 3, "l": 4, "xl": 5, "xxl": 6, "3xl": 7,
      "small": 2, "medium": 3, "large": 4,
      "default": 100, "universal": 101, "default size": 102, "default variant": 103
    }

    return [...vals].sort((a, b) => {
      const aLower = a.toLowerCase().trim()
      const bLower = b.toLowerCase().trim()

      const weightA = sizeWeights[aLower]
      const weightB = sizeWeights[bLower]

      if (weightA !== undefined && weightB !== undefined) {
        return weightA - weightB
      }
      if (weightA !== undefined) return -1
      if (weightB !== undefined) return 1

      const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10)
      const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10)
      if (numA !== numB) {
        return numA - numB
      }
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [option.values, isSizeOption])

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm font-medium text-ui-fg-subtle">Select {title}</span>
      <div
        className="flex flex-wrap gap-3"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const normalizedVal = v.toLowerCase().trim()
          const hex = (colorHexMap && colorHexMap[v]) || defaultColorHexMap[normalizedVal] || undefined
          const isSelected = v === current

          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 min-w-[100px] justify-center",
                isSelected
                  ? "border-black bg-white shadow-sm ring-1 ring-black"
                  : "border-gray-200 bg-ui-bg-subtle hover:border-gray-400"
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {isColorOption && (
                <span
                  className="w-4 h-4 rounded-full border border-gray-200 shrink-0"
                  style={{ backgroundColor: hex || "#888888" }}
                />
              )}
              <span className={clx(
                "text-sm font-medium",
                isSelected ? "text-black" : "text-ui-fg-subtle"
              )}>
                {v}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
