// Pure math for «مسیر ماجراجویی»: trip length, book depth, which section is
// active and how the dragged book settles. No React, no server-only imports:
// safe for client components and tests.

import { spineThickness } from "@/components/home/shelf-geometry"
import type { BookType } from "@/lib/catalog"

/** A reader's page takes about 1.2 minutes. */
export const SECONDS_PER_PAGE = 72

export const MIN_DEPTH = 14
export const MAX_DEPTH = 34

type LengthBook = {
  type: BookType
  pages?: number
  durationSeconds?: number
}

/** «مدت سفر»: listening time, or estimated reading time from the pages. */
export function tripSeconds(book: LengthBook): number | undefined {
  if (book.type === "audiobook") return book.durationSeconds || undefined
  return book.pages ? book.pages * SECONDS_PER_PAGE : undefined
}

/** Thickness of the 3D book in px (for a 300px-wide cover), 14..34. */
export function bookDepth(book: LengthBook): number {
  const thickness = spineThickness(book)
  // spineThickness is 44..84 on the same log scale; map it to 30..70.
  return Math.round(
    MIN_DEPTH + (thickness - 44) * ((MAX_DEPTH - MIN_DEPTH) / 40)
  )
}

/**
 * Index of the section that contains `line` (e.g. the viewport center), given
 * the sections' document tops in display order. Above the first section → 0.
 */
export function activeSection(tops: number[], line: number): number {
  let active = 0
  for (let index = 0; index < tops.length; index++) {
    if (tops[index] <= line) active = index
  }
  return active
}

/** Verified trigger from the supplemental source report, not viewport center. */
export function bookTrigger(width: number) {
  return width < 900 ? 0.3 : 0.25
}

/** Verified Praise-driven camera input. The world-unit calibration is scene-specific. */
export function journeyCamera(
  index: number,
  scrollY: number,
  width: number,
  height: number,
  sectionTops: number[],
  praiseTops: number[],
  praiseHeights: number[]
) {
  const small = width < 900
  const scale =
    width < 600
      ? 1
      : Math.max(1, ((height * (2000 / 1018)) / Math.min(2000, width)) * 1.1)
  const ratio = ((small ? 0.046 : 0.027) / (height / 1018)) * scale
  const previous = small
    ? (sectionTops[index] ?? 0) - (sectionTops[0] ?? 0)
    : praiseHeights
        .slice(0, index)
        .reduce((sum, praiseHeight) => sum + praiseHeight + height, 0)
  const local = small
    ? Math.max(0, scrollY - (sectionTops[index] ?? 0))
    : Math.max(0, height - (praiseTops[index] ?? Infinity) + scrollY)
  return {
    scroll: previous + local,
    previous,
    local,
    ratio,
    scale,
    activeScroll: scrollY - (sectionTops[index] ?? 0),
  }
}

/** Dragging the book: degrees of turn per pixel, and the tilt limit. */
export const DRAG_DEG_PER_PX = 0.5
export const MAX_TILT_X = 15

/**
 * The angle equivalent to `current` (same pose, whole turns apart) that is
 * nearest to `target`, so a spun book settles the short way round.
 */
export function nearestTurn(current: number, target: number): number {
  const delta = ((((current - target) % 360) + 540) % 360) - 180
  return target + delta
}
