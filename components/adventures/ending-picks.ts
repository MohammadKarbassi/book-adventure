// What the journey's closing page offers next: a few other adventures and
// the store shelf of the last book's category. Pure, for the client ending.

type Pickable = {
  id: number
  categorySlug: string
  book: { categoryTitle?: string }
}

export type EndingPicks<T> = {
  /** Other rooms to start from, never the one the reader just left. */
  others: T[]
  /** The last room's category in the store. */
  category?: { slug: string; title: string }
}

export function endingPicks<T extends Pickable>(
  items: T[],
  count = 3
): EndingPicks<T> {
  const last = items.at(-1)
  return {
    others: items.filter((item) => item.id !== last?.id).slice(0, count),
    category:
      last && last.book.categoryTitle
        ? { slug: last.categorySlug, title: last.book.categoryTitle }
        : undefined,
  }
}
