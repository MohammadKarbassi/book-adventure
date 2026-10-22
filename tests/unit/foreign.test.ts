import { describe, expect, it } from "vitest"

import catalog from "@/data/catalog.json"
import {
  FOREIGN_ID_OFFSET,
  FOREIGN_PRICE_MAX,
  FOREIGN_PRICE_MIN,
  FOREIGN_SUBJECTS,
  coverUrl,
  descriptionParagraphs,
  foreignBookHref,
  foreignId,
  foreignPrice,
  isForeignBook,
  isForeignId,
  isForeignSubject,
  isWorkId,
  toForeignBook,
  toShelf,
  workIdFromKey,
  yearFrom,
} from "@/lib/foreign"

describe("work ids", () => {
  it("accepts Open Library work ids only", () => {
    expect(isWorkId("OL45804W")).toBe(true)
    expect(isWorkId("OL1W")).toBe(true)
    for (const bad of [
      "abc",
      "OL45804M",
      "ol45804w",
      "OLW",
      "OL1W/",
      "45804",
    ]) {
      expect(isWorkId(bad)).toBe(false)
    }
  })

  it("reads keys", () => {
    expect(workIdFromKey("/works/OL45804W")).toBe("OL45804W")
    expect(workIdFromKey("OL45804W")).toBe("OL45804W")
    expect(workIdFromKey("/books/OL1M")).toBeNull()
  })
})

describe("foreignId", () => {
  it("maps the key number above the offset", () => {
    expect(foreignId("OL45804W")).toBe(1_000_045_804)
    expect(foreignId("OL1W")).toBe(FOREIGN_ID_OFFSET + 1)
  })

  it("is stable and distinct per work", () => {
    expect(foreignId("OL8400950W")).toBe(foreignId("OL8400950W"))
    expect(foreignId("OL1W")).not.toBe(foreignId("OL2W"))
  })

  it("never collides with Fidibo ids", () => {
    const fidiboIds = catalog.books.map((book) => book.id)
    expect(Math.max(...fidiboIds)).toBeLessThan(1_000_000)
    expect(fidiboIds.some(isForeignId)).toBe(false)
    expect(isForeignId(999_999)).toBe(false)
    expect(isForeignId(foreignId("OL1W"))).toBe(true)
  })

  it("throws for invalid ids", () => {
    expect(() => foreignId("abc")).toThrow()
  })
})

describe("foreignPrice", () => {
  const ids = Array.from(
    { length: 500 },
    (_, index) => `OL${index * 7919 + 1}W`
  )

  it("is deterministic", () => {
    expect(foreignPrice("OL45804W")).toBe(foreignPrice("OL45804W"))
  })

  it("stays in range and rounds to 1,000 Toman", () => {
    for (const id of ids) {
      const price = foreignPrice(id)
      expect(price).toBeGreaterThanOrEqual(FOREIGN_PRICE_MIN)
      expect(price).toBeLessThanOrEqual(FOREIGN_PRICE_MAX)
      expect(price % 1000).toBe(0)
    }
  })

  it("spreads across the range", () => {
    expect(new Set(ids.map(foreignPrice)).size).toBeGreaterThan(100)
  })
})

describe("urls", () => {
  it("builds cover and page urls", () => {
    expect(coverUrl(14543422)).toBe(
      "https://covers.openlibrary.org/b/id/14543422-M.jpg"
    )
    expect(coverUrl(14543422, "L")).toBe(
      "https://covers.openlibrary.org/b/id/14543422-L.jpg"
    )
    expect(foreignBookHref("OL1W")).toBe("/foreign/OL1W")
  })
})

describe("subjects", () => {
  it("has six known subjects", () => {
    expect(FOREIGN_SUBJECTS).toHaveLength(6)
    expect(isForeignSubject("fantasy")).toBe(true)
    expect(isForeignSubject("../etc")).toBe(false)
  })
})

const doc = {
  key: "/works/OL8400950W",
  title: "The Blade Itself",
  author_name: ["Joe Abercrombie"],
  cover_i: 14543422,
  first_publish_year: 2001,
  number_of_pages_median: 531,
  ratings_average: 4.096774,
  ratings_count: 93,
}

describe("toForeignBook / toShelf", () => {
  it("maps a search result", () => {
    expect(toForeignBook(doc)).toEqual({
      id: 1_008_400_950,
      workId: "OL8400950W",
      title: "The Blade Itself",
      authors: ["Joe Abercrombie"],
      cover: "https://covers.openlibrary.org/b/id/14543422-M.jpg",
      year: 2001,
      pages: 531,
      rating: 4.1,
      ratingsCount: 93,
      price: foreignPrice("OL8400950W"),
    })
  })

  it("rejects results without a key or title", () => {
    expect(toForeignBook({ ...doc, key: "/books/OL1M" })).toBeNull()
    expect(toForeignBook({ ...doc, title: " " })).toBeNull()
  })

  it("keeps only books with a cover and an author, once each", () => {
    const shelf = toShelf([
      doc,
      { ...doc, key: "/works/OL2W", cover_i: undefined },
      { ...doc, key: "/works/OL3W", author_name: [] },
      doc,
    ])
    expect(shelf.map((book) => book.workId)).toEqual(["OL8400950W"])
  })
})

describe("descriptionParagraphs", () => {
  it("reads strings and { value } objects", () => {
    expect(descriptionParagraphs("One.\r\n\r\nTwo.")).toEqual(["One.", "Two."])
    expect(descriptionParagraphs({ type: "/type/text", value: "Hi" })).toEqual([
      "Hi",
    ])
    expect(descriptionParagraphs(undefined)).toEqual([])
  })

  it("strips markdown links, rules and link targets", () => {
    const text =
      "See [the book](https://x.y) and [more][1].\n\n----------\n[1]: https://x.y"
    expect(descriptionParagraphs(text)).toEqual(["See the book and more."])
  })
})

describe("yearFrom", () => {
  it("finds a four digit year", () => {
    expect(yearFrom("March 1932")).toBe(1932)
    expect(yearFrom("1932-05-01")).toBe(1932)
    expect(yearFrom("unknown")).toBeUndefined()
  })
})

describe("isForeignBook", () => {
  const book = toForeignBook(doc)!

  it("accepts a mapped book and its JSON round trip", () => {
    expect(isForeignBook(book)).toBe(true)
    expect(isForeignBook(JSON.parse(JSON.stringify(book)))).toBe(true)
  })

  it("rejects mismatched ids, foreign hosts and bad shapes", () => {
    expect(isForeignBook({ ...book, id: 1 })).toBe(false)
    expect(
      isForeignBook({ ...book, cover: "https://evil.example/x.jpg" })
    ).toBe(false)
    expect(isForeignBook({ ...book, authors: "Joe" })).toBe(false)
    expect(isForeignBook({ ...book, price: "1" })).toBe(false)
    expect(isForeignBook(null)).toBe(false)
  })
})
