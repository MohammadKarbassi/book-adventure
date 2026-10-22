// The home-page stack shows the adventures. Pure: takes adventures, returns
// slim serializable props, so the server page can call it and tests can too.

import type { ShelfBook } from "@/components/home/shelf-geometry"
import type { Adventure } from "@/lib/adventures"

export function toShelfBook({ book, copy }: Adventure): ShelfBook {
  return {
    id: book.id,
    name: copy.name,
    categorySlug: book.categorySlug,
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
