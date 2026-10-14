import React, { useId } from "react"
import clx from "clsx"

interface StarRatingProps {
  rating: number | string | null | undefined
  count?: number | string | null | undefined
  size?: "sm" | "md" | "lg"
  showText?: boolean
  showVerified?: boolean
  className?: string
}

export default function StarRating({
  rating,
  count,
  size = "sm",
  showText = true,
  showVerified = false,
  className = "",
}: StarRatingProps) {
  const rawId = useId()
  const idPrefix = rawId.replace(/[^a-zA-Z0-9_-]/g, "")

  if (rating === null || rating === undefined || rating === "") return null

  const numRating = typeof rating === "string" ? parseFloat(rating) : rating
  if (isNaN(numRating) || numRating <= 0) return null

  // Clamped between 1.0 and 5.0
  const clamped = Math.min(5, Math.max(1, numRating))
  const formattedRating = clamped.toFixed(1)

  const starSizes = {
    sm: "w-3 h-3 small:w-3.5 small:h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  const textSizes = {
    sm: "text-[11px] small:text-[12px]",
    md: "text-xs small:text-sm",
    lg: "text-sm small:text-base",
  }

  return (
    <div className={clx("inline-flex items-center gap-1.5 flex-nowrap", className)}>
      <div className="flex items-center gap-0.5" aria-label={`Rating: ${formattedRating} out of 5 stars`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.min(100, Math.max(0, Math.round((clamped - i) * 100)))
          const gradId = `${idPrefix}-star-${i}`

          return (
            <svg
              key={i}
              className={clx(starSizes[size], "flex-shrink-0")}
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset={`${fill}%`} stopColor="#F59E0B" />
                  <stop offset={`${fill}%`} stopColor="#E2E8F0" />
                </linearGradient>
              </defs>
              <path
                fill={`url(#${gradId})`}
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          )
        })}
      </div>

      {showText && (
        <span className={clx("font-bold text-slate-800 leading-none", textSizes[size])}>
          {formattedRating}
        </span>
      )}

      {count && (
        <span className={clx("text-slate-400 font-medium leading-none", textSizes[size])}>
          ({count})
        </span>
      )}

      {showVerified && (
        <span className="inline-flex items-center gap-1 text-[10px] small:text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 ml-1">
          <svg className="w-2.5 h-2.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Verified
        </span>
      )}
    </div>
  )
}
