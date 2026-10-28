import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

/** Read-only stars (supports halves) with an accessible text label. */
export function StarRating({
  value,
  label,
  size = "sm",
  className,
}: {
  value: number
  label: string
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const px = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={label} dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - (star - 1)))
        return (
          <span key={star} className={cn("relative inline-block", px)} aria-hidden>
            <Star className={cn("absolute inset-0 text-ring-warm", px)} />
            {fill > 0 ? (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("fill-star text-star", px)} />
              </span>
            ) : null}
          </span>
        )
      })}
    </span>
  )
}
