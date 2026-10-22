import { describe, expect, it } from "vitest"

import palettes from "@/data/palettes.json"
import { ADVENTURE_COPY } from "@/data/adventures"
import { getAdventures } from "@/lib/adventures"
import { getAllBooks, getBook } from "@/lib/catalog"

const ADVENTURE_COUNT = 14
const ROUTE_LABELS = ["نقطهٔ شروع", "گذرگاه", "مقصد"]
// Sensitive topics kept off the journey, matched against titles.
const EXCLUDED_TITLES = [
  "خودکشی",
  "سمفونی مردگان",
  "هزار خورشید تابان",
  "مردی به نام اوه",
  "سه شنبه ها با موری",
  "فرار از اردوگاه",
  "نبرد من",
]
const HEX = /^#[0-9a-f]{6}$/

describe("adventure copy", () => {
  it(`has ${ADVENTURE_COUNT} adventures for distinct catalog books`, () => {
    expect(ADVENTURE_COPY).toHaveLength(ADVENTURE_COUNT)
    const ids = ADVENTURE_COPY.map((copy) => copy.bookId)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(getBook(id), `book ${id}`).toBeDefined()
  })

  it("leaves out sensitive titles", () => {
    for (const copy of ADVENTURE_COPY) {
      const title = getBook(copy.bookId)!.title
      for (const excluded of EXCLUDED_TITLES) {
        expect(title).not.toContain(excluded)
      }
    }
  })

  it("includes at least four audiobooks", () => {
    const audiobooks = ADVENTURE_COPY.filter(
      (copy) => getBook(copy.bookId)!.type === "audiobook"
    )
    expect(audiobooks.length).toBeGreaterThanOrEqual(4)
  })

  it.each(ADVENTURE_COPY.map((copy) => [copy.name, copy] as const))(
    "%s stays within the length limits",
    (_, copy) => {
      expect(copy.name.length).toBeLessThanOrEqual(30)
      expect(copy.tagline.length).toBeLessThanOrEqual(70)
      expect(copy.story.length).toBeGreaterThanOrEqual(2)
      expect(copy.story.length).toBeLessThanOrEqual(3)
      for (const paragraph of copy.story) {
        expect(paragraph.length).toBeLessThanOrEqual(330)
      }
      expect(copy.route.map((stage) => stage.label)).toEqual(ROUTE_LABELS)
      for (const stage of copy.route) {
        expect(stage.title.length).toBeLessThanOrEqual(28)
        expect(stage.text.length).toBeLessThanOrEqual(140)
      }
      expect(copy.gear).toHaveLength(3)
      for (const item of copy.gear) expect(item.length).toBeLessThanOrEqual(50)
      expect([1, 2, 3]).toContain(copy.difficulty)
    }
  )
})

describe("getAdventures", () => {
  it(`numbers the adventures 1..${ADVENTURE_COUNT} in copy order`, () => {
    const adventures = getAdventures()
    expect(adventures.map((adventure) => adventure.number)).toEqual(
      Array.from({ length: ADVENTURE_COUNT }, (_, index) => index + 1)
    )
    expect(adventures.map((adventure) => adventure.book.id)).toEqual(
      ADVENTURE_COPY.map((copy) => copy.bookId)
    )
  })
})

describe("cover palettes", () => {
  it("has valid colors for every catalog book", () => {
    const byId = palettes as Record<
      string,
      { top: string; bottom: string; accent: string }
    >
    for (const book of getAllBooks()) {
      const palette = byId[String(book.id)]
      expect(palette, `palette for ${book.id}`).toBeDefined()
      expect(palette.top).toMatch(HEX)
      expect(palette.bottom).toMatch(HEX)
      expect(palette.accent).toMatch(HEX)
    }
  })
})
