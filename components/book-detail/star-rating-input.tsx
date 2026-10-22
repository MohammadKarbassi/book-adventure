"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

import { RATING_LABELS } from "./book-detail-utils"

type StarRatingInputProps = {
  value: number
  onChange: (rating: number) => void
  invalid?: boolean
  id?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

const STARS = [1, 2, 3, 4, 5] as const

/**
 * Five single-select toggles. Arrow keys move between stars, Space/Enter
 * picks one; the stars up to the hovered or chosen one light up.
 */
export function StarRatingInput({
  value,
  onChange,
  invalid,
  id,
  ...aria
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0)
  const shown = hovered || value

  return (
    <div className="flex items-center gap-3">
      <ToggleGroup
        id={id}
        value={value ? [String(value)] : []}
        onValueChange={(next) => {
          // Pressing the chosen star again keeps it instead of clearing.
          if (next.length > 0) onChange(Number(next[0]))
        }}
        spacing={0.5}
        aria-invalid={invalid || undefined}
        onPointerLeave={() => setHovered(0)}
        className="rounded-lg"
        {...aria}
      >
        {STARS.map((star) => (
          <ToggleGroupItem
            key={star}
            value={String(star)}
            aria-label={`${formatNumber(star)} ستاره، ${RATING_LABELS[star - 1]}`}
            onPointerEnter={() => setHovered(star)}
            className="size-9 px-0 hover:bg-transparent aria-pressed:bg-transparent"
          >
            <StarIcon
              className={cn(
                "size-6 transition-[color,fill,scale] duration-150 motion-reduce:transition-none",
                star <= shown
                  ? "fill-primary text-primary"
                  : "fill-transparent text-muted-foreground/50",
                star === hovered && "scale-110"
              )}
            />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <span
        aria-hidden="true"
        className="min-w-14 text-sm text-muted-foreground"
      >
        {shown ? RATING_LABELS[shown - 1] : null}
      </span>
    </div>
  )
}
