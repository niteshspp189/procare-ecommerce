import React from "react"
import clsx from "clsx"

interface SectionProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
  innerClassName?: string
  id?: string
  fullWidth?: boolean
}

export default function Section({
  children,
  title,
  subtitle,
  className,
  innerClassName,
  id,
  fullWidth = false,
}: SectionProps) {
  return (
    <section id={id} className={clsx("w-full bg-white", className)}>
      <div className={clsx(
        fullWidth ? "w-full" : "section-wrapper", 
        innerClassName
      )}>
        {(title || subtitle) && (
          <div className="mb-12 text-center">
            {subtitle && (
              <p className="text-sm uppercase tracking-[0.2em] text-gray-400 mb-2 font-bold">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-[clamp(28px,4vw,42px)] font-normal text-black leading-tight">
                {title}
              </h2>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
