import { EllipseMiniSolid } from "@medusajs/icons"
import { Label, RadioGroup, Text, clx } from "@medusajs/ui"
import { useState } from "react"

type FilterRadioGroupProps = {
  title: string
  items: {
    value: string
    label: string
  }[]
  value: any
  handleChange: (...args: any[]) => void
  defaultOpen?: boolean
  "data-testid"?: string
}

const FilterRadioGroup = ({
  title,
  items,
  value,
  handleChange,
  defaultOpen = true,
  "data-testid": dataTestId,
}: FilterRadioGroupProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="flex flex-col gap-y-3">
      {!!title && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left focus:outline-none focus:opacity-80 transition-opacity"
        >
          <Text className="txt-compact-small-plus text-ui-fg-muted font-bold">{title}</Text>
          <span className="text-sm font-semibold text-gray-500 w-5 h-5 flex items-center justify-center">
            {isOpen ? "−" : "+"}
          </span>
        </button>
      )}

      {isOpen && (
        <div className="space-y-2.5 flex flex-col gap-y-2">
          <RadioGroup data-testid={dataTestId} onValueChange={handleChange}>
            {items?.map((i) => {
              const itemId = `${title}-${i.value}`
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")

              const isSelected = i.value === value

              return (
                <div
                  key={i.value}
                  className={clx("flex gap-x-2 items-center my-1.5", {
                    "ml-[-23px]": isSelected,
                  })}
                >
                  {isSelected && <EllipseMiniSolid />}
                  <RadioGroup.Item
                    checked={isSelected}
                    className="hidden peer"
                    id={itemId}
                    value={i.value}
                  />
                  <Label
                    htmlFor={itemId}
                    className={clx(
                      "!txt-compact-small !transform-none hover:cursor-pointer transition-colors",
                      {
                        "text-black font-bold": isSelected,
                        "text-gray-600 font-normal hover:text-black": !isSelected,
                      }
                    )}
                    data-testid="radio-label"
                    data-active={isSelected}
                  >
                    {i.label}
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </div>
      )}
    </div>
  )
}

export default FilterRadioGroup
