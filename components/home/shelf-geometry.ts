// Pure layout math for the home-page book stack («قفسهٔ ماجراجویی»).
// No React and no server-only imports: safe for client components and tests.

import type { BookColor, BookType } from "@/lib/catalog"

/** The slim, serializable shape one shelf book needs. */
export type ShelfBook = {
  /** The book id; also the adventure's route segment. */
  id: number
  /** Adventure name, e.g. «سقوط در آمستردام». */
  name: string
  categorySlug: string
  title: string
  author: string
  type: BookType
  image: string
  color: BookColor
  finalPrice: number
  price?: number
  discountPct?: number
  free: boolean
  pages?: number
  durationSeconds?: number
}

export const MIN_THICKNESS = 44
export const MAX_THICKNESS = 84
/** Largest tilt, in degrees, at the top and bottom of the viewport. */
export const MAX_TILT = 28
/** Tilt used instead of scrolling when the user prefers reduced motion. */
export const STATIC_TILT = -8

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/** Position of `value` between `min` and `max` on a log scale, 0..1. */
function logScale(value: number, min: number, max: number) {
  return clamp01(Math.log(value / min) / Math.log(max / min))
}

/**
 * Spine thickness in px: ebooks by page count, audiobooks by duration, on a
 * log scale so a 700-page novel isn't ten times a 70-page essay.
 */
export function spineThickness(
  book: Pick<ShelfBook, "type" | "pages" | "durationSeconds">
): number {
  const t =
    book.type === "audiobook"
      ? logScale(book.durationSeconds ?? 3600 * 4, 1200, 60 * 60 * 20)
      : logScale(book.pages ?? 200, 50, 700)
  return Math.round(MIN_THICKNESS + t * (MAX_THICKNESS - MIN_THICKNESS))
}

/** Deterministic pseudo-random number in [0, 1) for an id and a salt. */
export function seeded(id: number, salt: number): number {
  let h = Math.imul(id ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt, 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

export type SpineLayout = {
  thickness: number
  /** Percent of the stack width, 88..100. */
  widthPct: number
  /** Inline-start offset in percent; widthPct + offsetPct never exceeds 100. */
  offsetPct: number
}

/** A real stack is never perfectly aligned: vary width and offset per book. */
export function spineLayout(book: ShelfBook): SpineLayout {
  const widthPct = Math.round(88 + seeded(book.id, 1) * 12)
  const offsetPct = Math.round((100 - widthPct) * seeded(book.id, 2) * 10) / 10
  return { thickness: spineThickness(book), widthPct, offsetPct }
}

/**
 * Tilt for a book's scroll progress through the viewport (0 = just entering
 * at the bottom, 0.5 = centered, 1 = leaving at the top). Like looking at a
 * stack from its middle: books below eye level show their top (the cover),
 * books above it show their underside.
 */
export function shelfTilt(progress: number, max = MAX_TILT): number {
  const p = clamp01(progress)
  // CSS rotateX: a positive angle tips the top edge toward the viewer.
  return (p - 0.5) * 2 * max
}

/** Books nearest the viewport center paint over their neighbors' faces. */
export function shelfZIndex(progress: number): number {
  return Math.round(100 - Math.abs(clamp01(progress) - 0.5) * 100)
}
