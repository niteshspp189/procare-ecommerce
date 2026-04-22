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
  const hasSwatches = isColorOption && colorHexMap && Object.keys(colorHexMap).length > 0

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">Select {title}</span>
      <div
        className={clx(
          "flex flex-wrap gap-2",
          hasSwatches ? "justify-start" : "justify-between"
        )}
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const hex = hasSwatches ? colorHexMap![v] : undefined
          const isSelected = v === current

          if (hasSwatches && hex) {
            return (
              <button
                key={v}
                onClick={() => updateOption(option.id, v)}
                disabled={disabled}
                title={v}
                data-testid="option-button"
                className={clx(
                  "relative w-10 h-10 rounded-full border-2 transition-all duration-150 focus:outline-none",
                  isSelected
                    ? "border-black scale-110 shadow-md ring-2 ring-offset-1 ring-black"
                    : "border-gray-200 hover:border-gray-400 hover:scale-105"
                )}
                style={{ backgroundColor: hex }}
              >
                {isSelected && (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-white"
                    style={{ textShadow: "0 0 3px rgba(0,0,0,0.6)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            )
          }

          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 flex-1",
                {
                  "border-ui-border-interactive": isSelected,
                  "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
                    !isSelected,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
      {hasSwatches && current && (
        <span className="text-xs text-ui-fg-subtle">{current}</span>
      )}
    </div>
  )
}

export default OptionSelect
