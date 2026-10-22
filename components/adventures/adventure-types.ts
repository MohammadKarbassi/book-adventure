// The slim, serializable shape the client journey receives for one adventure.

import type { Room } from "@/components/adventures/room-colors"
import type { Track } from "@/components/player/types"
import type { BookColor, BookType } from "@/lib/catalog"

export type AdventureStop = { label: string; title: string; text: string }

export type AdventurePalette = { top: string; bottom: string; accent: string }

export type AdventureReview = { user: string; rating: number; text: string }

export type AdventureBook = {
  id: number
  title: string
  type: BookType
  authors: string[]
  narrators?: string[]
  image: string
  color: BookColor
  finalPrice: number
  price?: number
  discountPct?: number
  free: boolean
  inPlus: boolean
  categorySlug: string
  categoryTitle?: string
  moods: string[]
}

export type AdventureView = {
  /** Stable id: the book id, also the route segment. */
  id: number
  /** For ordering by the reader's interests. */
  categorySlug: string
  name: string
  tagline: string
  story: string[]
  route: AdventureStop[]
  gear: string[]
  difficulty: 1 | 2 | 3
  palette: AdventurePalette
  /** The section's own colors and ink, from the palette. */
  room: Room
  book: AdventureBook
  /** «مدت سفر» in seconds. */
  tripSeconds?: number
  /** Thickness of the 3D book in px, for a 300px cover. */
  depth: number
  reviews: AdventureReview[]
  reviewsCount: number
  /** Audiobooks only: the free sample for the global player. */
  track?: Track
}
