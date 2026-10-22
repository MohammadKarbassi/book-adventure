import { describe, expect, it } from "vitest"

import {
  PAGE_SIZE,
  defaultBrowseState,
  filterBooks,
  getPageNumbers,
  highlightParts,
  paginate,
  parseBrowseParams,
  parseSearchParams,
  popularAuthors,
  searchPodcasts,
  serializeBrowseParams,
  serializeSearchParams,
  sortBooks,
} from "@/lib/browse"
import type { BookSummary } from "@/lib/catalog"

type TestBook = BookSummary & { categoryTitles: string[] }

function book(overrides: Partial<TestBook> & { id: number }): TestBook {
  return {
    title: `کتاب ${overrides.id}`,
    type: "ebook",
    authors: ["نویسنده"],
    image: "https://cdn.fidibo.com/x.jpg",
    color: { dominant: "#000000", isDark: true },
    finalPrice: 10000,
    inPlus: false,
    free: false,
    rating: 4,
    ratingsCount: 10,
    categorySlug: "history",
    categoryTitles: ["تاریخ"],
    ...overrides,
  }
}

const books: TestBook[] = [
  book({ id: 1, ratingsCount: 50, finalPrice: 30000, rating: 3.5 }),
  book({
    id: 2,
    type: "audiobook",
    ratingsCount: 200,
    finalPrice: 0,
    free: true,
    rating: 4.8,
  }),
  book({
    id: 3,
    inPlus: true,
    ratingsCount: 120,
    finalPrice: 50000,
    discountPct: 30,
    categoryTitles: ["تاریخ", "تاریخ جهان"],
  }),
  book({
    id: 4,
    type: "audiobook",
    inPlus: true,
    ratingsCount: 5,
    finalPrice: 20000,
    discountPct: 10,
    rating: 4.8,
    categoryTitles: ["تاریخ", "تاریخ جهان"],
  }),
]

const ids = (list: { id: number }[]) => list.map((item) => item.id)

describe("parseBrowseParams / serializeBrowseParams", () => {
  it("returns defaults for empty or invalid params", () => {
    expect(parseBrowseParams({})).toEqual(defaultBrowseState)
    expect(
      parseBrowseParams({ type: "video", sort: "x", plus: "yes", page: "-2" })
    ).toEqual(defaultBrowseState)
    expect(parseBrowseParams({ page: "1.5" }).page).toBe(1)
  })

  it("reads valid values and the first of repeated params", () => {
    expect(
      parseBrowseParams({
        type: ["audio", "ebook"],
        sort: "cheapest",
        plus: "1",
        sub: "history-world",
        page: "3",
      })
    ).toEqual({
      type: "audio",
      sort: "cheapest",
      plus: true,
      sub: "history-world",
      page: 3,
    })
  })

  it("omits defaults and round-trips", () => {
    expect(serializeBrowseParams(defaultBrowseState)).toBe("")
    const state = {
      type: "ebook",
      sort: "discount",
      plus: true,
      sub: "history-world",
      page: 2,
    } as const
    const query = serializeBrowseParams(state)
    expect(query).toBe(
      "?type=ebook&sort=discount&plus=1&sub=history-world&page=2"
    )
    expect(
      parseBrowseParams(Object.fromEntries(new URLSearchParams(query)))
    ).toEqual(state)
  })
})

describe("parseSearchParams / serializeSearchParams", () => {
  it("trims the query and validates the type", () => {
    expect(parseSearchParams({ q: "  سقوط ", type: "audio" })).toEqual({
      q: "سقوط",
      type: "audio",
    })
    expect(parseSearchParams({})).toEqual({ q: "", type: "all" })
    expect(serializeSearchParams({ q: " ", type: "all" })).toBe("")
    expect(serializeSearchParams({ q: "بوف کور", type: "ebook" })).toBe(
      "?q=%D8%A8%D9%88%D9%81+%DA%A9%D9%88%D8%B1&type=ebook"
    )
  })
})

describe("filterBooks", () => {
  it("filters by type, subscription and subcategory", () => {
    expect(ids(filterBooks(books, {}))).toEqual([1, 2, 3, 4])
    expect(ids(filterBooks(books, { type: "audio" }))).toEqual([2, 4])
    expect(ids(filterBooks(books, { type: "ebook" }))).toEqual([1, 3])
    expect(ids(filterBooks(books, { plus: true }))).toEqual([3, 4])
    expect(
      ids(filterBooks(books, { subcategoryTitle: "تاریخ جهان", type: "audio" }))
    ).toEqual([4])
  })
})

describe("sortBooks", () => {
  it("sorts by each key without mutating the input", () => {
    const before = ids(books)
    expect(ids(sortBooks(books, "popular"))).toEqual([2, 3, 1, 4])
    expect(ids(sortBooks(books, "rating"))).toEqual([2, 4, 3, 1])
    expect(ids(sortBooks(books, "cheapest"))).toEqual([2, 4, 1, 3])
    expect(ids(sortBooks(books, "expensive"))).toEqual([3, 1, 4, 2])
    expect(ids(sortBooks(books, "discount"))).toEqual([3, 4, 2, 1])
    expect(ids(books)).toEqual(before)
  })
})

describe("paginate", () => {
  const items = Array.from({ length: 50 }, (_, index) => index)

  it("slices pages and clamps out-of-range pages", () => {
    expect(PAGE_SIZE).toBe(12)
    expect(paginate(items, 1)).toMatchObject({ page: 1, pageCount: 5 })
    expect(paginate(items, 1).items).toHaveLength(12)
    expect(paginate(items, 2).items[0]).toBe(12)
    expect(paginate(items, 5).items).toEqual([48, 49])
    expect(paginate(items, 99).page).toBe(5)
    expect(paginate(items, 0).page).toBe(1)
    expect(paginate([], 2)).toEqual({
      items: [],
      page: 1,
      pageCount: 1,
      total: 0,
    })
  })
})

describe("getPageNumbers", () => {
  it("lists every page when there are few", () => {
    expect(getPageNumbers(1, 1)).toEqual([1])
    expect(getPageNumbers(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it("collapses long ranges with ellipses", () => {
    expect(getPageNumbers(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ])
    expect(getPageNumbers(1, 10)).toEqual([1, 2, "ellipsis", 10])
    expect(getPageNumbers(3, 10)).toEqual([1, 2, 3, 4, "ellipsis", 10])
    expect(getPageNumbers(10, 10)).toEqual([1, "ellipsis", 9, 10])
  })
})

describe("searchPodcasts", () => {
  const podcasts = [
    { id: "1", title: "پادکست جعبه", author: "منصور ضابطیان", description: "" },
    { id: "2", title: "رادیو مرز", author: "Marzie", description: "سفر" },
  ]

  it("matches normalized title, author and description", () => {
    expect(ids2(searchPodcasts(podcasts, "جعبه"))).toEqual(["1"])
    expect(ids2(searchPodcasts(podcasts, "ضابطيان"))).toEqual(["1"])
    expect(ids2(searchPodcasts(podcasts, "marzie"))).toEqual(["2"])
    expect(ids2(searchPodcasts(podcasts, "سفر"))).toEqual(["2"])
    expect(searchPodcasts(podcasts, "  ")).toEqual([])
  })

  function ids2(list: { id: string }[]) {
    return list.map((item) => item.id)
  }
})

describe("highlightParts", () => {
  it("marks normalized matches but keeps the original text", () => {
    expect(highlightParts("کیمیاگر", "كيمياگر")).toEqual([
      { text: "کیمیاگر", match: true },
    ])
    expect(highlightParts("ملت عشق", "عشق")).toEqual([
      { text: "ملت ", match: false },
      { text: "عشق", match: true },
    ])
    expect(highlightParts("می‌خواهم زندگی کنم", "میخواهم")).toEqual([
      { text: "می‌خواهم", match: true },
      { text: " زندگی کنم", match: false },
    ])
  })

  it("returns the text unmarked without a query or a match", () => {
    expect(highlightParts("سقوط", "")).toEqual([{ text: "سقوط", match: false }])
    expect(highlightParts("سقوط", "xyz")).toEqual([
      { text: "سقوط", match: false },
    ])
  })
})

describe("popularAuthors", () => {
  it("ranks authors by the total ratings of their books", () => {
    const list = [
      { authors: ["الف"], ratingsCount: 10 },
      { authors: ["ب", "الف"], ratingsCount: 15 },
      { authors: ["ج"], ratingsCount: 20 },
    ]
    expect(popularAuthors(list)).toEqual(["الف", "ج", "ب"])
    expect(popularAuthors(list, 1)).toEqual(["الف"])
  })
})
