// Pure math for «مسیر ماجراجویی»: trip length, book depth, which section is
// active and how the dragged book settles. No React, no server-only imports:
// safe for client components and tests.

import { spineThickness } from "@/components/home/shelf-geometry"
import type { BookType } from "@/lib/catalog"

/** A reader's page takes about 1.2 minutes. */
export const SECONDS_PER_PAGE = 72

export const MIN_DEPTH = 30
export const MAX_DEPTH = 70

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

/** Thickness of the 3D book in px (for a 300px-wide cover), 30..70. */
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
