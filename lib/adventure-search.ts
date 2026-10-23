// Pure matching for adventures in search. Client-safe: no catalog imports.

import { normalizePersian } from "@/lib/text"

/** Slim adventure shape sent to the search UI. */
export type AdventureSearchItem = {
  bookId: number
  name: string
  tagline: string
  bookTitle: string
}

const compact = (text: string) => normalizePersian(text).replace(/ /g, "")

/** Adventures whose name, tagline or book title contain every query term. */
export function matchAdventures(
  items: readonly AdventureSearchItem[],
  query: string
): AdventureSearchItem[] {
  const terms = normalizePersian(query).split(" ").filter(Boolean)
  if (terms.length === 0) return []
  return items.filter((item) => {
    const haystack = compact(
      [item.name, item.tagline, item.bookTitle].join("|")
    )
    return terms.every((term) => haystack.includes(term))
  })
}
