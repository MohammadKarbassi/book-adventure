import { StarIcon } from "lucide-react"

import { RatingStars } from "@/components/book/rating-stars"
import { Progress } from "@/components/ui/progress"
import type { RatingDistribution } from "@/lib/catalog"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

type RatingSummaryProps = {
  rating: number
  ratingsCount: number
  distribution: RatingDistribution
  className?: string
}

const STARS = ["5", "4", "3", "2", "1"] as const

export function RatingSummary({
  rating,
  ratingsCount,
  distribution,
  className,
}: RatingSummaryProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8",
        className
      )}
    >
      <div className="flex shrink-0 flex-col items-start gap-2">
        <p className="text-sm font-medium">امتیاز خوانندگان</p>
        <RatingStars rating={rating} count={ratingsCount} variant="full" />
        <p className="text-xs text-muted-foreground">بر پایهٔ رأی‌های فیدیبو</p>
      </div>
      <ul
        aria-label="پراکندگی امتیازها"
        className="flex flex-1 flex-col gap-1.5"
      >
        {STARS.map((star) => {
          const percent = distribution[star] ?? 0
          const label = `${formatNumber(Number(star))} ستاره`
          return (
            <li key={star} className="flex items-center gap-3 text-xs">
              <span className="inline-flex w-8 shrink-0 items-center gap-1 text-muted-foreground">
                {formatNumber(Number(star))}
                <StarIcon
                  aria-hidden="true"
                  className="size-3 fill-primary text-primary"
                />
              </span>
              <Progress
                value={percent}
                aria-label={label}
                // Same digits on the server and in the browser.
                locale="fa-IR"
                className="flex-1 [&_[data-slot=progress-track]]:h-1.5"
              />
              <span className="w-9 shrink-0 text-end text-muted-foreground tabular-nums">
                {`${formatNumber(percent)}٪`}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
