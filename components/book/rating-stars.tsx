import { StarIcon } from "lucide-react"

import { formatNumber, formatRating } from "@/lib/format"
import { cn } from "@/lib/utils"

type RatingStarsProps = {
  rating: number
  /** Number of ratings, shown after the score. */
  count?: number
  variant?: "compact" | "full"
  className?: string
}

function ratingLabel(rating: number, count?: number) {
  const label = `امتیاز ${formatRating(rating)} از ۵`
  return count ? `${label}، ${formatNumber(count)} رأی` : label
}

export function RatingStars({
  rating,
  count,
  variant = "compact",
  className,
}: RatingStarsProps) {
  const label = ratingLabel(rating, count)

  if (variant === "compact") {
    return (
      <span
        role="img"
        aria-label={label}
        className={cn(
          "inline-flex items-center gap-1 text-xs text-muted-foreground",
          className
        )}
      >
        <StarIcon className="size-3.5 fill-primary text-primary" />
        <span className="font-medium text-foreground">
          {formatRating(rating)}
        </span>
        {count ? <span>({formatNumber(count)})</span> : null}
      </span>
    )
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-2 text-sm", className)}
    >
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.min(Math.max(rating - index, 0), 1)
          return (
            <span key={index} className="relative inline-flex">
              <StarIcon className="size-4 fill-muted text-muted-foreground/40" />
              {fill > 0 ? (
                <span
                  className="absolute inset-y-0 start-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <StarIcon className="size-4 fill-primary text-primary" />
                </span>
              ) : null}
            </span>
          )
        })}
      </span>
      <span className="font-medium">{formatRating(rating)}</span>
      {count ? (
        <span className="text-muted-foreground">
          ({formatNumber(count)} رأی)
        </span>
      ) : null}
    </span>
  )
}
