"use client"

import { BookOpenIcon, HeadphonesIcon, LibraryBigIcon } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { typeFilters, type TypeFilter } from "@/lib/browse"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const icons = {
  all: LibraryBigIcon,
  ebook: BookOpenIcon,
  audio: HeadphonesIcon,
} as const

type TypeToggleGroupProps = {
  value: TypeFilter
  onValueChange: (value: TypeFilter) => void
  /** Optional result counts shown next to each label. */
  counts?: Record<TypeFilter, number>
  className?: string
}

/** Segmented «همه / الکترونیکی / صوتی» control. */
export function TypeToggleGroup({
  value,
  onValueChange,
  counts,
  className,
}: TypeToggleGroupProps) {
  return (
    <ToggleGroup
      aria-label="نوع کتاب"
      variant="outline"
      spacing={0}
      value={[value]}
      onValueChange={(next) => {
        // Pressing the active item again would leave nothing selected.
        const [selected] = next as TypeFilter[]
        if (selected) onValueChange(selected)
      }}
      className={cn("bg-card", className)}
    >
      {typeFilters.map((filter) => {
        const Icon = icons[filter.value]
        return (
          <ToggleGroupItem
            key={filter.value}
            value={filter.value}
            aria-label={filter.label}
            disabled={
              counts !== undefined &&
              counts[filter.value] === 0 &&
              filter.value !== value
            }
            className="px-3 aria-pressed:bg-accent aria-pressed:text-accent-foreground"
          >
            <Icon data-icon="inline-start" />
            {filter.label}
            {counts ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatNumber(counts[filter.value])}
              </span>
            ) : null}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
