// Server-only: builds the slim adventure list for search from the catalog.

import { ADVENTURE_COPY } from "@/data/adventures"
import type { AdventureSearchItem } from "@/lib/adventure-search"
import { getBook } from "@/lib/catalog"

export function getAdventureSearchItems(): AdventureSearchItem[] {
  return ADVENTURE_COPY.flatMap((copy) => {
    const book = getBook(copy.bookId)
    return book
      ? [
          {
            bookId: copy.bookId,
            name: copy.name,
            tagline: copy.tagline,
            bookTitle: book.title,
          },
        ]
      : []
  })
}
