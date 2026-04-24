import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  colorHexMap?: Record<string, string>
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
  colorHexMap,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const isColorOption = title.toLowerCase() === "color"

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm font-medium text-ui-fg-subtle">Select {title}</span>
      <div
        className="flex flex-wrap gap-3"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const hex = colorHexMap ? colorHexMap[v] : undefined
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
