import React from "react"
import clsx from "clsx"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary"
  className?: string
  children: React.ReactNode
}

export default function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-all uppercase whitespace-nowrap",
        {
          "bg-[#0bb799] text-white hover:bg-[#099980] shadow-md hover:shadow-lg": variant === "primary",
          "bg-white text-[#0bb799] border-2 border-[#0bb799] hover:bg-[#0bb799] hover:text-white": variant === "secondary",
        },
        className
      )}
    >
      {children}
    </button>
  )
}
