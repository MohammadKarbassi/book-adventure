// Server-only (the "server-only" package isn't installed): import this from
// Server Components only. Requests go through Next's fetch cache for a day,
// with a User-Agent as Open Library asks.
//
// Test mode: when OPENLIBRARY_FIXTURES names a directory, JSON fixtures are
// read from it instead of the network (search-<subject>.json,
// work-<id>.json, search-key-<id>.json).

import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { cache } from "react"
import { notFound, redirect } from "next/navigation"

import {
  SEARCH_FIELDS,
  descriptionParagraphs,
  foreignBookHref,
  foreignId,
  foreignPrice,
  coverUrl,
  isWorkId,
  toForeignBook,
  toShelf,
  workIdFromKey,
  yearFrom,
  type ForeignBook,
  type ForeignSubject,
  type SearchDoc,
} from "@/lib/foreign"

const API = "https://openlibrary.org"
const USER_AGENT =
  "BookAdventure/1.0 (+https://github.com/MohammadKarbassi/book-adventure)"
const REVALIDATE_SECONDS = 86_400
const TIMEOUT_MS = 8_000
const SHELF_SIZE = 12

/** Any failure talking to Open Library (network, timeout, 5xx, bad JSON). */
export class OpenLibraryError extends Error {
  readonly status?: number
  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause })
    this.name = "OpenLibraryError"
    this.status = options?.status
  }
}

/** The requested work doesn't exist. */
export class OpenLibraryNotFoundError extends OpenLibraryError {
  constructor(message: string) {
    super(message, { status: 404 })
    this.name = "OpenLibraryNotFoundError"
  }
}

async function readFixture(dir: string, file: string): Promise<unknown> {
  let text: string
  try {
    text = await readFile(join(process.cwd(), dir, file), "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new OpenLibraryNotFoundError(`No fixture ${file}`)
    }
    throw new OpenLibraryError(`Cannot read fixture ${file}`, { cause: error })
  }
  return JSON.parse(text) as unknown
}

async function getJson(path: string, fixture: string): Promise<unknown> {
  const fixtures = process.env.OPENLIBRARY_FIXTURES
  if (fixtures) return readFixture(fixtures, fixture)

  const url = `${API}${path}`
  let response: Response
  try {
    response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    throw new OpenLibraryError(`Request failed: ${url}`, { cause: error })
  }
  if (response.status === 404) {
    throw new OpenLibraryNotFoundError(`Not found: ${url}`)
  }
  if (!response.ok) {
    throw new OpenLibraryError(`HTTP ${response.status}: ${url}`, {
      status: response.status,
    })
  }
  try {
    return (await response.json()) as unknown
  } catch (error) {
    throw new OpenLibraryError(`Invalid JSON: ${url}`, { cause: error })
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function searchDocs(data: unknown): SearchDoc[] {
  if (!isObject(data) || !Array.isArray(data.docs)) {
    throw new OpenLibraryError("Unexpected search response")
  }
  return data.docs.filter(isObject)
}

/** Up to 12 books with a cover and an author for one subject. */
export async function getForeignShelf(
  subject: ForeignSubject
): Promise<ForeignBook[]> {
  const query = new URLSearchParams({
    subject,
    limit: String(SHELF_SIZE),
    fields: SEARCH_FIELDS,
  })
  const data = await getJson(`/search.json?${query}`, `search-${subject}.json`)
  return toShelf(searchDocs(data))
}

export type ForeignBookDetail = ForeignBook & {
  /** Plain paragraphs; empty when Open Library has no description. */
  description: string[]
  subjects: string[]
}

const MAX_SUBJECTS = 8

async function fetchForeignBook(workId: string): Promise<ForeignBookDetail> {
  if (!isWorkId(workId)) notFound()

  const query = new URLSearchParams({
    q: `key:/works/${workId}`,
    fields: SEARCH_FIELDS,
    limit: "1",
  })
  const [work, search] = await Promise.all([
    getJson(`/works/${workId}.json`, `work-${workId}.json`),
    // Author names, ratings and the median page count live in the search
    // index; a miss there only costs those details.
    getJson(`/search.json?${query}`, `search-key-${workId}.json`).catch(
      (error: unknown) => {
        if (error instanceof OpenLibraryNotFoundError) return { docs: [] }
        throw error
      }
    ),
  ]).catch((error: unknown) => {
    if (error instanceof OpenLibraryNotFoundError) notFound()
    throw error
  })

  if (!isObject(work)) throw new OpenLibraryError("Unexpected work response")
  const type = isObject(work.type) ? work.type.key : undefined
  // Merged works point to their new id.
  if (type === "/type/redirect" && typeof work.location === "string") {
    const target = workIdFromKey(work.location)
    if (target && target !== workId) redirect(foreignBookHref(target))
    notFound()
  }
  if (type !== "/type/work") notFound()

  const doc = searchDocs(search).find((item) => item.key === `/works/${workId}`)
  const summary = doc ? toForeignBook(doc, "L") : null
  const title =
    typeof work.title === "string" && work.title.trim()
      ? work.title.trim()
      : summary?.title
  if (!title) notFound()

  const workCover = Array.isArray(work.covers)
    ? work.covers.find((id): id is number => typeof id === "number" && id > 0)
    : undefined
  const subjects = Array.isArray(work.subjects)
    ? [
        ...new Set(
          work.subjects.filter(
            (item): item is string =>
              typeof item === "string" && item.length <= 40
          )
        ),
      ].slice(0, MAX_SUBJECTS)
    : []

  return {
    id: foreignId(workId),
    workId,
    title,
    authors: summary?.authors ?? [],
    cover: summary?.cover ?? (workCover ? coverUrl(workCover, "L") : null),
    year: summary?.year ?? yearFrom(work.first_publish_date),
    pages: summary?.pages,
    rating: summary?.rating,
    ratingsCount: summary?.ratingsCount,
    price: foreignPrice(workId),
    description: descriptionParagraphs(work.description),
    subjects,
  }
}

/**
 * One work with its description and subjects. Calls notFound() for invalid
 * ids and missing works; throws OpenLibraryError when the API fails.
 * Cached per request so generateMetadata and the page share the result.
 */
export const getForeignBook = cache(fetchForeignBook)
