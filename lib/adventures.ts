// «مسیر ماجراجویی»: the 18 shelf books as numbered adventures. Copy lives in
// data/adventures.ts, cover palettes in data/palettes.json. Server-only, like
// lib/catalog.ts: pass slim props to client components.

import palettesData from "@/data/palettes.json"
import { ADVENTURE_COPY } from "@/data/adventures"
import { getBook, type Book } from "@/lib/catalog"

export type AdventureStage = {
  /** e.g. «نقطهٔ شروع», «گذرگاه», «مقصد» */
  label: string
  title: string
  text: string
}

export type AdventureCopy = {
  bookId: number
  /** Adventure name, e.g. «سقوط در آمستردام». */
  name: string
  /** One line under the name. */
  tagline: string
  /** 2–3 short paragraphs in an adventurous voice. */
  story: string[]
  /** Start, passage, destination. */
  route: [AdventureStage, AdventureStage, AdventureStage]
  /** «توشهٔ سفر»: what the reader takes away, 3 items. */
  gear: string[]
  /** 1 آسان، 2 متوسط، 3 دشوار */
  difficulty: 1 | 2 | 3
}

/** Colors sampled from the cover: top and bottom bands, plus an accent. */
export type BookPalette = { top: string; bottom: string; accent: string }

export type Adventure = {
  /** 1-based; «ماجراجویی ۱» … */
  number: number
  book: Book
  copy: AdventureCopy
  palette: BookPalette
}

const palettes = palettesData as Record<string, BookPalette>

/** The cover's sampled palette, or its dominant color when none was sampled. */
export function getBookPalette(book: Book): BookPalette {
  return (
    palettes[String(book.id)] ?? {
      top: book.color.dominant,
      bottom: book.color.dominant,
      accent: book.color.dominant,
    }
  )
}

const adventures: Adventure[] = ADVENTURE_COPY.flatMap((copy, index) => {
  const book = getBook(copy.bookId)
  return book
    ? [{ number: index + 1, book, copy, palette: getBookPalette(book) }]
    : []
})

export function getAdventures(): Adventure[] {
  return adventures
}

export function getAdventure(number: number): Adventure | undefined {
  return adventures.find((adventure) => adventure.number === number)
}

export function getAdventureByBookId(bookId: number): Adventure | undefined {
  return adventures.find((adventure) => adventure.book.id === bookId)
}
