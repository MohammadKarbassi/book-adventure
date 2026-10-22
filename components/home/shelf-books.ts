// Picks the books for the home-page stack. Pure: takes books, returns slim
// serializable props, so the server page can call it and tests can too.

import type { Book } from "@/lib/catalog"
import type { ShelfBook } from "@/components/home/shelf-geometry"

export const SHELF_SIZE = 18

/** Euclidean distance between two "#rrggbb" colors, 0..~441. */
export function colorDistance(a: string, b: string): number {
  const channels = (hex: string) =>
    [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))
  const [r1, g1, b1] = channels(a)
  const [r2, g2, b2] = channels(b)
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2)
}

export function toShelfBook(book: Book): ShelfBook {
  return {
    id: book.id,
    title: book.title,
    author: book.authors[0] ?? "",
    type: book.type,
    image: book.image,
    color: book.color,
    finalPrice: book.finalPrice,
    price: book.price,
    discountPct: book.discountPct,
    free: book.free,
    pages: book.pages,
    durationSeconds: book.durationSeconds,
  }
}

/** Takes one book from each list in turn, skipping repeats. */
function interleave(lists: Book[][]): Book[] {
  const seen = new Set<number>()
  const result: Book[] = []
  const longest = Math.max(0, ...lists.map((list) => list.length))
  for (let index = 0; index < longest; index++) {
    for (const list of lists) {
      const book = list[index]
      if (book && !seen.has(book.id)) {
        seen.add(book.id)
        result.push(book)
      }
    }
  }
  return result
}

/** Colors closer than this count as "the same" cover color. */
const SIMILAR = 48
/** Neighbors in the stack should differ at least this much. */
const CONTRAST = 90

/**
 * Up to `size` featured books from the given lists (in priority order):
 * every book has an author, near-duplicate colors are used only as a last
 * resort, and the order avoids two similar colors on top of each other.
 */
export function pickShelfBooks(
  lists: Book[][],
  size = SHELF_SIZE
): ShelfBook[] {
  const candidates = interleave(lists).filter((book) => book.authors.length)

  const chosen: Book[] = []
  const similar: Book[] = []
  for (const book of candidates) {
    if (chosen.length === size) break
    const clash = chosen.some(
      (other) =>
        colorDistance(other.color.dominant, book.color.dominant) < SIMILAR
    )
    ;(clash ? similar : chosen).push(book)
  }
  chosen.push(...similar.slice(0, size - chosen.length))

  // Greedy order: keep priority, but skip ahead past a color too close to
  // the book below; if nothing contrasts enough, take the most different.
  const ordered: Book[] = []
  const remaining = [...chosen]
  while (remaining.length) {
    const last = ordered.at(-1)
    let index = 0
    if (last) {
      const distances = remaining.map((book) =>
        colorDistance(last.color.dominant, book.color.dominant)
      )
      index = distances.findIndex((distance) => distance >= CONTRAST)
      if (index === -1) index = distances.indexOf(Math.max(...distances))
    }
    ordered.push(...remaining.splice(index, 1))
  }

  return ordered.map(toShelfBook)
}
