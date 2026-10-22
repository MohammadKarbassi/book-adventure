// Pure helpers for foreign books from Open Library. No fetching here, so
// client components and unit tests can import it; lib/openlibrary.ts does
// the (server-only) requests.

/** A foreign book as lists, cards and the library need it. */
export type ForeignBook = {
  /** Site-wide numeric id (see foreignId), used by favorites and purchases. */
  id: number
  /** Open Library work id, e.g. "OL45804W". */
  workId: string
  title: string
  authors: string[]
  /** Cover image URL, null when Open Library has none. */
  cover: string | null
  year?: number
  pages?: number
  rating?: number
  ratingsCount?: number
  /** Made-up price in Toman, the same for a book every time. */
  price: number
}

export const FOREIGN_SUBJECTS = [
  {
    slug: "fantasy",
    title: "فانتزی",
    description: "جهان‌های جادویی، اژدهاها و سفرهای حماسی",
  },
  {
    slug: "science_fiction",
    title: "علمی‌تخیلی",
    description: "آینده، فضا و پرسش‌هایی که علم پیش می‌کشد",
  },
  {
    slug: "mystery",
    title: "معمایی و جنایی",
    description:
      "کارآگاه‌ها، سرنخ‌ها و معماهایی که تا صفحهٔ آخر رهایتان نمی‌کنند",
  },
  {
    slug: "classics",
    title: "کلاسیک‌ها",
    description: "کتاب‌هایی که نسل‌به‌نسل خوانده شده‌اند",
  },
  {
    slug: "history",
    title: "تاریخ",
    description: "روایت آدم‌ها و دوره‌هایی که جهان امروز را ساختند",
  },
  {
    slug: "philosophy",
    title: "فلسفه",
    description: "پرسش‌های بزرگ دربارهٔ زندگی، دانستن و درست زیستن",
  },
] as const

export type ForeignSubject = (typeof FOREIGN_SUBJECTS)[number]["slug"]

export function isForeignSubject(value: string): value is ForeignSubject {
  return FOREIGN_SUBJECTS.some((subject) => subject.slug === value)
}

/** Fidibo ids are below 1,000,000; foreign ids start far above them. */
export const FOREIGN_ID_OFFSET = 1_000_000_000

const WORK_ID = /^OL(\d{1,12})W$/

export function isWorkId(value: string): boolean {
  return WORK_ID.test(value)
}

/** "/works/OL45804W" or "OL45804W" → "OL45804W"; null for anything else. */
export function workIdFromKey(key: string): string | null {
  const id = key.replace(/^\/works\//, "")
  return isWorkId(id) ? id : null
}

/** "OL45804W" → 1_000_045_804. Throws for an invalid work id. */
export function foreignId(workId: string): number {
  const match = WORK_ID.exec(workId)
  if (!match) throw new Error(`Invalid Open Library work id: ${workId}`)
  return FOREIGN_ID_OFFSET + Number(match[1])
}

export function isForeignId(id: number): boolean {
  return Number.isSafeInteger(id) && id >= FOREIGN_ID_OFFSET
}

export function foreignBookHref(workId: string): string {
  return `/foreign/${workId}`
}

export function openLibraryUrl(workId: string): string {
  return `https://openlibrary.org/works/${workId}`
}

// FNV-1a: small, fast and stable across runtimes.
function hash(text: string): number {
  let value = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 0x01000193)
  }
  return value >>> 0
}

export const FOREIGN_PRICE_MIN = 79_000
export const FOREIGN_PRICE_MAX = 349_000

/** A price between 79,000 and 349,000 Toman, rounded to 1,000. */
export function foreignPrice(workId: string): number {
  const steps = (FOREIGN_PRICE_MAX - FOREIGN_PRICE_MIN) / 1000 + 1
  return FOREIGN_PRICE_MIN + (hash(workId) % steps) * 1000
}

export type CoverSize = "M" | "L"

const COVER_BASE = "https://covers.openlibrary.org/b/id/"

export function coverUrl(coverId: number, size: CoverSize = "M"): string {
  return `${COVER_BASE}${coverId}-${size}.jpg`
}

/** One result of search.json with the fields we ask for. */
export type SearchDoc = {
  key?: unknown
  title?: unknown
  author_name?: unknown
  cover_i?: unknown
  first_publish_year?: unknown
  number_of_pages_median?: unknown
  ratings_average?: unknown
  ratings_count?: unknown
}

export const SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "cover_i",
  "first_publish_year",
  "number_of_pages_median",
  "ratings_average",
  "ratings_count",
].join(",")

const positiveInt = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : undefined

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is string => typeof item === "string" && item.trim() !== ""
      )
    : []

/** Search result → ForeignBook; null without a valid key or title. */
export function toForeignBook(
  doc: SearchDoc,
  size: CoverSize = "M"
): ForeignBook | null {
  const workId = typeof doc.key === "string" ? workIdFromKey(doc.key) : null
  const title = typeof doc.title === "string" ? doc.title.trim() : ""
  if (!workId || !title) return null
  const coverId = positiveInt(doc.cover_i)
  const rating =
    typeof doc.ratings_average === "number" && doc.ratings_average > 0
      ? Math.round(doc.ratings_average * 10) / 10
      : undefined
  return {
    id: foreignId(workId),
    workId,
    title,
    authors: stringList(doc.author_name).slice(0, 3),
    cover: coverId ? coverUrl(coverId, size) : null,
    year: positiveInt(doc.first_publish_year),
    pages: positiveInt(doc.number_of_pages_median),
    rating,
    ratingsCount: rating ? positiveInt(doc.ratings_count) : undefined,
    price: foreignPrice(workId),
  }
}

/** Shelf entries need a cover and an author to look right. */
export function toShelf(docs: SearchDoc[]): ForeignBook[] {
  const seen = new Set<string>()
  return docs.flatMap((doc) => {
    const book = toForeignBook(doc)
    if (!book || !book.cover || book.authors.length === 0) return []
    if (seen.has(book.workId)) return []
    seen.add(book.workId)
    return [book]
  })
}

/**
 * Work descriptions are a string or { value }, often with Markdown links,
 * "----" rules and source notes. Returns plain paragraphs.
 */
export function descriptionParagraphs(value: unknown): string[] {
  const text =
    typeof value === "string"
      ? value
      : typeof value === "object" &&
          value !== null &&
          "value" in value &&
          typeof value.value === "string"
        ? value.value
        : ""
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        // Reference-style link targets ("[1]: https://…") and rules.
        .filter((line) => !/^\s*(\[\d+\]:|-{3,}|_{3,}|\*{3,})/.test(line))
        .join(" ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]+)\]\[\d+\]/g, "$1")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((paragraph) => paragraph.length > 0)
}

/** "1932", "March 1932", "1932-05-01" → 1932. */
export function yearFrom(value: unknown): number | undefined {
  if (typeof value !== "string") return undefined
  const match = /\b(\d{4})\b/.exec(value)
  return match ? Number(match[1]) : undefined
}

/** Validator for stored ForeignBook values (localStorage). */
export function isForeignBook(value: unknown): value is ForeignBook {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }
  const book = value as Record<string, unknown>
  const optionalNumber = (item: unknown) =>
    item === undefined || (typeof item === "number" && Number.isFinite(item))
  return (
    typeof book.workId === "string" &&
    isWorkId(book.workId) &&
    book.id === foreignId(book.workId) &&
    typeof book.title === "string" &&
    Array.isArray(book.authors) &&
    book.authors.every((author) => typeof author === "string") &&
    (book.cover === null ||
      (typeof book.cover === "string" && book.cover.startsWith(COVER_BASE))) &&
    typeof book.price === "number" &&
    Number.isFinite(book.price) &&
    optionalNumber(book.year) &&
    optionalNumber(book.pages) &&
    optionalNumber(book.rating) &&
    optionalNumber(book.ratingsCount)
  )
}
