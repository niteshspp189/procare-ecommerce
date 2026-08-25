import { Label } from "@medusajs/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched, required, topLabel, value, defaultValue, onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)
    const [hasVal, setHasVal] = useState(Boolean(value || defaultValue))

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useEffect(() => {
      const checkVal = () => {
        if (inputRef.current) {
          const v = inputRef.current.value
          if (v && v.trim().length > 0) {
            setHasVal(true)
          }
        }
      }
      checkVal()
      const t1 = setTimeout(checkVal, 100)
      const t2 = setTimeout(checkVal, 300)
      const t3 = setTimeout(checkVal, 800)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }, [])

    useImperativeHandle(ref, () => inputRef.current!)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasVal(Boolean(e.target.value && e.target.value.length > 0))
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            type={inputType}
            name={name}
            placeholder=" "
            required={required}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onAnimationStart={(e) => {
              if (e.animationName.toLowerCase().includes("autofill") || e.animationName.toLowerCase().includes("auto-fill")) {
                setHasVal(true)
              }
            }}
            className="pt-4 pb-1 block w-full h-11 px-4 mt-0 bg-ui-bg-field border rounded-md appearance-none focus:outline-none focus:ring-0 focus:shadow-borders-interactive-with-active border-ui-border-base hover:bg-ui-bg-field-hover peer"
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={name}
            onClick={() => inputRef.current?.focus()}
            className={`flex items-center justify-center mx-3 px-1 transition-all absolute duration-200 pointer-events-none origin-0 text-ui-fg-subtle ${
              hasVal
                ? "top-1 -translate-y-1 text-[11px]"
                : "top-3 peer-focus:top-1 peer-focus:-translate-y-1 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:-translate-y-1 peer-[:not(:placeholder-shown)]:text-[11px] peer-autofill:top-1 peer-autofill:-translate-y-1 peer-autofill:text-[11px]"
            }`}
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-ui-fg-subtle px-4 focus:outline-none transition-all duration-150 outline-none focus:text-ui-fg-base absolute right-0 top-3"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
