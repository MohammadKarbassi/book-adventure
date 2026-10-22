// Server-side: turns the full adventures (with whole Book records) into the
// slim props the client journey needs. Do not import from client components.

import type { AdventureView } from "@/components/adventures/adventure-types"
import type { CategoryMap } from "@/components/adventures/journey-order"
import { bookDepth, tripSeconds } from "@/components/adventures/journey-math"
import { roomColors } from "@/components/adventures/room-colors"
import { buildBookTrack } from "@/components/book-detail/book-track"
import type { Adventure } from "@/lib/adventures"
import { getAllBooks, getCategory, type Review } from "@/lib/catalog"

/** Reviews that read well as a short quote: helpful ones first. */
function pickReviews(reviews: Review[], count = 3) {
  return reviews
    .filter((review) => review.text.trim().length >= 30)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, count)
    .map(({ user, rating, text }) => ({
      user,
      rating,
      text:
        text.trim().length > 260
          ? `${text.trim().slice(0, 250)}…`
          : text.trim(),
    }))
}

export function toAdventureView({
  book,
  copy,
  palette,
}: Adventure): AdventureView {
  return {
    id: book.id,
    categorySlug: book.categorySlug,
    name: copy.name,
    tagline: copy.tagline,
    story: copy.story,
    route: copy.route,
    gear: copy.gear,
    difficulty: copy.difficulty,
    palette,
    room: roomColors(palette),
    book: {
      id: book.id,
      title: book.title,
      type: book.type,
      authors: book.authors,
      narrators: book.narrators,
      image: book.image,
      color: book.color,
      finalPrice: book.finalPrice,
      price: book.price,
      discountPct: book.discountPct,
      free: book.free,
      inPlus: book.inPlus,
      categorySlug: book.categorySlug,
      categoryTitle: getCategory(book.categorySlug)?.title,
      moods: book.moods,
    },
    tripSeconds: tripSeconds(book),
    depth: bookDepth(book),
    reviews: pickReviews(book.reviews),
    reviewsCount: book.reviewsCount,
    track: book.type === "audiobook" ? buildBookTrack(book) : undefined,
  }
}

/** bookId → categorySlug for every catalog book (the reader's signals). */
export function getCategoryMap(): CategoryMap {
  return Object.fromEntries(
    getAllBooks().map((book) => [String(book.id), book.categorySlug])
  )
}
