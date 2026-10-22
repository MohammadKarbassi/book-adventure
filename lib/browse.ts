// Pure helpers for the category, search and audiobook pages: URL state,
// filtering, sorting, pagination and match highlighting. Safe to import from
// client and server code (only types come from lib/catalog).

import type { BookSummary, BookType } from "@/lib/catalog"
import { normalizePersian } from "@/lib/text"

export type RawSearchParams = Record<string, string | string[] | undefined>

/** The `type` filter as it appears in the URL (`?type=audio`). */
export type TypeFilter = "all" | "ebook" | "audio"

export const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "ebook", label: "الکترونیکی" },
  { value: "audio", label: "صوتی" },
]

export type SortKey =
  "popular" | "rating" | "cheapest" | "expensive" | "discount"

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "popular", label: "پرفروش‌ترین" },
  { value: "rating", label: "بیشترین امتیاز" },
  { value: "cheapest", label: "ارزان‌ترین" },
  { value: "expensive", label: "گران‌ترین" },
  { value: "discount", label: "بیشترین تخفیف" },
]

export const PAGE_SIZE = 12

export type BrowseState = {
  type: TypeFilter
  sort: SortKey
  /** Only books included in the subscription. */
  plus: boolean
  /** Subcategory slug, or null for «همه». */
  sub: string | null
  /** 1-based. */
  page: number
}

export const defaultBrowseState: BrowseState = {
  type: "all",
  sort: "popular",
  plus: false,
  sub: null,
  page: 1,
}

/** First value of a search param that may repeat. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function parseType(value: string | undefined): TypeFilter {
  return value === "ebook" || value === "audio" ? value : "all"
}

function parsePage(value: string | undefined): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

/** Reads category page state from `searchParams`; invalid values fall back to defaults. */
export function parseBrowseParams(params: RawSearchParams): BrowseState {
  const sort = first(params.sort)
  const sub = first(params.sub)?.trim()
  return {
    type: parseType(first(params.type)),
    sort: sortOptions.some((option) => option.value === sort)
      ? (sort as SortKey)
      : "popular",
    plus: first(params.plus) === "1",
    sub: sub ? sub : null,
    page: parsePage(first(params.page)),
  }
}

/** Query string for a state, defaults omitted: "" or "?type=audio&sort=cheapest". */
export function serializeBrowseParams(state: Partial<BrowseState>): string {
  const params = new URLSearchParams()
  if (state.type && state.type !== "all") params.set("type", state.type)
  if (state.sort && state.sort !== "popular") params.set("sort", state.sort)
  if (state.plus) params.set("plus", "1")
  if (state.sub) params.set("sub", state.sub)
  if (state.page && state.page > 1) params.set("page", String(state.page))
  const query = params.toString()
  return query ? `?${query}` : ""
}

export type SearchState = {
  q: string
  type: TypeFilter
}

export function parseSearchParams(params: RawSearchParams): SearchState {
  return {
    q: (first(params.q) ?? "").trim(),
    type: parseType(first(params.type)),
  }
}

export function serializeSearchParams(state: Partial<SearchState>): string {
  const params = new URLSearchParams()
  const q = state.q?.trim()
  if (q) params.set("q", q)
  if (state.type && state.type !== "all") params.set("type", state.type)
  const query = params.toString()
  return query ? `?${query}` : ""
}

const bookTypeOf: Record<Exclude<TypeFilter, "all">, BookType> = {
  ebook: "ebook",
  audio: "audiobook",
}

export function matchesType(book: Pick<BookSummary, "type">, type: TypeFilter) {
  return type === "all" || book.type === bookTypeOf[type]
}

type FilterOptions = {
  type?: TypeFilter
  plus?: boolean
  /** A book matches when its categoryTitles include this title. */
  subcategoryTitle?: string | null
}

export function filterBooks<
  T extends BookSummary & { categoryTitles?: string[] },
>(
  books: readonly T[],
  { type = "all", plus = false, subcategoryTitle = null }: FilterOptions
): T[] {
  return books.filter(
    (book) =>
      matchesType(book, type) &&
      (!plus || book.inPlus) &&
      (!subcategoryTitle ||
        (book.categoryTitles ?? []).includes(subcategoryTitle))
  )
}

const discountOf = (book: BookSummary) =>
  book.free ? 0 : (book.discountPct ?? 0)

const comparators: Record<SortKey, (a: BookSummary, b: BookSummary) => number> =
  {
    popular: (a, b) => b.ratingsCount - a.ratingsCount,
    rating: (a, b) => b.rating - a.rating || b.ratingsCount - a.ratingsCount,
    cheapest: (a, b) =>
      a.finalPrice - b.finalPrice || b.ratingsCount - a.ratingsCount,
    expensive: (a, b) =>
      b.finalPrice - a.finalPrice || b.ratingsCount - a.ratingsCount,
    discount: (a, b) =>
      discountOf(b) - discountOf(a) || b.ratingsCount - a.ratingsCount,
  }

/** Returns a sorted copy; the input is left untouched. */
export function sortBooks<T extends BookSummary>(
  books: readonly T[],
  sort: SortKey
): T[] {
  return [...books].sort(comparators[sort])
}

export type PageSlice<T> = {
  items: T[]
  /** The page actually shown, clamped to 1…pageCount. */
  page: number
  pageCount: number
  total: number
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize = PAGE_SIZE
): PageSlice<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount)
  const start = (current - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageCount,
    total: items.length,
  }
}

/**
 * Page numbers for a pagination bar with "ellipsis" gaps:
 * (5, 10) → [1, "ellipsis", 4, 5, 6, "ellipsis", 10].
 */
export function getPageNumbers(
  current: number,
  pageCount: number
): (number | "ellipsis")[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }
  const pages = new Set([1, pageCount, current - 1, current, current + 1])
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((a, b) => a - b)
  const result: (number | "ellipsis")[] = []
  for (const page of sorted) {
    const previous = result.at(-1)
    if (typeof previous === "number" && page - previous === 2) {
      result.push(previous + 1)
    } else if (typeof previous === "number" && page - previous > 2) {
      result.push("ellipsis")
    }
    result.push(page)
  }
  return result
}

const searchTerms = (query: string) =>
  normalizePersian(query).split(" ").filter(Boolean)

const compact = (text: string) => text.replace(/ /g, "")

type SearchablePodcast = { title: string; author: string; description: string }

/**
 * Same rules as searchBooks in lib/catalog: every query word must appear in
 * the title, author or description; letter variants and spaces are ignored.
 */
export function searchPodcasts<T extends SearchablePodcast>(
  podcasts: readonly T[],
  query: string
): T[] {
  const terms = searchTerms(query)
  if (terms.length === 0) return []
  return podcasts.filter((podcast) => {
    const haystack = compact(
      normalizePersian(
        [podcast.title, podcast.author, podcast.description].join("|")
      )
    )
    return terms.every((term) => haystack.includes(term))
  })
}

export type TextPart = { text: string; match: boolean }

/**
 * Splits `text` into matched and unmatched parts for <mark> highlighting.
 * Matching is normalized like the search itself (ي/ی, ZWNJ, diacritics,
 * digits, case), but the returned parts keep the original characters.
 */
export function highlightParts(text: string, query: string): TextPart[] {
  const terms = searchTerms(query)
  if (!text || terms.length === 0) return [{ text, match: false }]

  // Normalize char by char, remembering which original char each came from.
  let normalized = ""
  const origin: number[] = []
  Array.from(text).reduce((offset, char) => {
    const mapped = /\s/.test(char) ? " " : normalizePersian(char)
    for (const unit of mapped) {
      normalized += unit
      origin.push(offset)
    }
    return offset + char.length
  }, 0)

  const marked = new Array<boolean>(text.length).fill(false)
  for (const term of terms) {
    let from = normalized.indexOf(term)
    while (from !== -1) {
      const start = origin[from]
      const lastOrigin = origin[from + term.length - 1]
      const end = lastOrigin + (text.codePointAt(lastOrigin)! > 0xffff ? 2 : 1)
      marked.fill(true, start, end)
      from = normalized.indexOf(term, from + term.length)
    }
  }

  const parts: TextPart[] = []
  for (let index = 0; index < text.length; index++) {
    const last = parts.at(-1)
    if (last && last.match === marked[index]) last.text += text[index]
    else parts.push({ text: text[index], match: marked[index] })
  }
  return parts
}

/** Authors ordered by the total ratings of their books, most read first. */
export function popularAuthors(
  books: readonly Pick<BookSummary, "authors" | "ratingsCount">[],
  limit = 8
): string[] {
  const totals = new Map<string, number>()
  for (const book of books) {
    for (const author of book.authors) {
      totals.set(author, (totals.get(author) ?? 0) + book.ratingsCount)
    }
  }
  return [...totals]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([author]) => author)
}
