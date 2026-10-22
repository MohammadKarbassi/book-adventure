import { describe, expect, it } from "vitest"

import {
  colorDistance,
  pickShelfBooks,
  SHELF_SIZE,
} from "@/components/home/shelf-books"
import {
  MAX_THICKNESS,
  MAX_TILT,
  MIN_THICKNESS,
  seeded,
  shelfTilt,
  shelfZIndex,
  spineLayout,
  spineThickness,
  type ShelfBook,
} from "@/components/home/shelf-geometry"
import { getAllBooks, getList, type Book } from "@/lib/catalog"

const featuredLists = () => [
  getList("bestsellers"),
  getList("plus"),
  getList("audioBestsellers"),
  getList("newest"),
]

describe("pickShelfBooks", () => {
  const shelf = pickShelfBooks(featuredLists())

  it("picks 18 distinct books, all with an author", () => {
    expect(shelf).toHaveLength(SHELF_SIZE)
    expect(new Set(shelf.map((book) => book.id)).size).toBe(SHELF_SIZE)
    expect(shelf.every((book) => book.author.length > 0)).toBe(true)
  })

  it("mixes ebooks and audiobooks", () => {
    const audio = shelf.filter((book) => book.type === "audiobook").length
    expect(audio).toBeGreaterThanOrEqual(3)
    expect(SHELF_SIZE - audio).toBeGreaterThanOrEqual(3)
  })

  it("never stacks two near-identical colors", () => {
    for (let index = 1; index < shelf.length; index++) {
      expect(
        colorDistance(
          shelf[index - 1].color.dominant,
          shelf[index].color.dominant
        )
      ).toBeGreaterThan(40)
    }
  })

  it("returns only serializable slim props", () => {
    const keys = Object.keys(shelf[0])
    expect(keys).not.toContain("description")
    expect(keys).not.toContain("reviews")
    expect(JSON.parse(JSON.stringify(shelf))).toEqual(shelf)
  })

  it("dedupes across lists and respects the size", () => {
    const list = getAllBooks().slice(0, 6)
    const picked = pickShelfBooks([list, list], 4)
    expect(picked).toHaveLength(4)
    expect(new Set(picked.map((book) => book.id)).size).toBe(4)
  })

  it("skips books without an author", () => {
    const [book] = getAllBooks()
    const anonymous: Book = { ...book, id: -1, authors: [] }
    expect(pickShelfBooks([[anonymous, book]]).map((b) => b.id)).toEqual([
      book.id,
    ])
  })
})

describe("shelf geometry", () => {
  const ebook = (pages?: number): ShelfBook => ({
    id: 1,
    title: "t",
    author: "a",
    type: "ebook",
    image: "",
    color: { dominant: "#000000", isDark: true },
    finalPrice: 0,
    free: true,
    pages,
  })

  it("thickness grows with pages and duration, within bounds", () => {
    expect(spineThickness(ebook(10))).toBe(MIN_THICKNESS)
    expect(spineThickness(ebook(5000))).toBe(MAX_THICKNESS)
    expect(spineThickness(ebook(300))).toBeGreaterThan(
      spineThickness(ebook(100))
    )
    const audio = (durationSeconds: number) =>
      spineThickness({ type: "audiobook", durationSeconds })
    expect(audio(60 * 60 * 15)).toBeGreaterThan(audio(60 * 30))
    expect(audio(60)).toBe(MIN_THICKNESS)
  })

  it("layout is deterministic and stays inside the stack", () => {
    for (const book of getAllBooks()) {
      const layout = spineLayout({ ...ebook(book.pages), id: book.id })
      expect(layout).toEqual(spineLayout({ ...ebook(book.pages), id: book.id }))
      expect(layout.widthPct).toBeGreaterThanOrEqual(88)
      expect(layout.widthPct).toBeLessThanOrEqual(100)
      expect(layout.offsetPct).toBeGreaterThanOrEqual(0)
      expect(layout.widthPct + layout.offsetPct).toBeLessThanOrEqual(100)
    }
  })

  it("seeded values are in [0, 1) and vary by salt", () => {
    const values = [1, 2, 3, 4].map((salt) => seeded(84590, salt))
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true)
    expect(new Set(values).size).toBe(4)
  })

  it("tilts from one side to the other through the viewport", () => {
    expect(shelfTilt(0)).toBe(-MAX_TILT)
    expect(shelfTilt(0.5)).toBe(0)
    expect(shelfTilt(1)).toBe(MAX_TILT)
    expect(shelfTilt(2)).toBe(MAX_TILT)
  })

  it("the centered book is on top", () => {
    expect(shelfZIndex(0.5)).toBeGreaterThan(shelfZIndex(0.3))
    expect(shelfZIndex(0.3)).toBe(shelfZIndex(0.7))
    expect(shelfZIndex(0)).toBe(50)
  })
})
