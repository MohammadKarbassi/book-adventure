import { describe, expect, it } from "vitest"

import {
  getCategoryMap,
  toAdventureView,
} from "@/components/adventures/adventure-views"
import {
  MAX_DEPTH,
  MIN_DEPTH,
  SECONDS_PER_PAGE,
  activeSection,
  bookDepth,
  nearestTurn,
  tripSeconds,
  bookTrigger,
  journeyCamera,
} from "@/components/adventures/journey-math"
import {
  NO_SIGNALS,
  categoryScores,
  orderJourney,
  startedBookIds,
} from "@/components/adventures/journey-order"
import {
  DARK_INK,
  LIGHT_INK,
  contrastRatio,
  hexToOklch,
  oklchToHex,
  roomColors,
} from "@/components/adventures/room-colors"
import { getAdventures } from "@/lib/adventures"

const items = [
  { id: 1, categorySlug: "history" },
  { id: 2, categorySlug: "psychology" },
  { id: 3, categorySlug: "literature" },
  { id: 4, categorySlug: "psychology" },
]
const categoryOf = {
  "10": "psychology",
  "11": "literature",
  "12": "literature",
  "13": "history",
}

describe("orderJourney", () => {
  it("keeps the default order without signals", () => {
    const result = orderJourney(items, NO_SIGNALS, categoryOf)
    expect(result.items).toBe(items)
    expect(result.personalized).toBe(false)
  })

  it("puts the reader's categories first, stable within ties", () => {
    const result = orderJourney(
      items,
      { ...NO_SIGNALS, favorites: [10] },
      categoryOf
    )
    expect(result.items.map((item) => item.id)).toEqual([2, 4, 1, 3])
    expect(result.personalized).toBe(true)
  })

  it("weighs purchases over favorites over progress", () => {
    const scores = categoryScores(
      { purchases: [13], favorites: [10], started: [11, 12] },
      categoryOf
    )
    expect(scores.get("history")).toBe(3)
    expect(scores.get("psychology")).toBe(2)
    expect(scores.get("literature")).toBe(2)
    const result = orderJourney(
      items,
      { purchases: [13], favorites: [10], started: [11, 12] },
      categoryOf
    )
    expect(result.items.map((item) => item.id)).toEqual([1, 2, 3, 4])
  })

  it("ignores unknown books and duplicate ids", () => {
    const scores = categoryScores(
      { purchases: [], favorites: [999, 10, 10], started: [] },
      categoryOf
    )
    expect([...scores]).toEqual([["psychology", 2]])
    const none = orderJourney(
      items,
      { ...NO_SIGNALS, favorites: [999] },
      categoryOf
    )
    expect(none.personalized).toBe(false)
  })

  it("reads reader pages and audiobook positions, not podcasts", () => {
    expect(
      startedBookIds(
        { "10": 3, "11": 0 },
        { "book-12": 40, "book-13": 0, "podcast-ep-1": 90 }
      ).sort()
    ).toEqual([10, 12])
  })
})

describe("journey math", () => {
  it("uses the verified 25/30 percent activation breakpoint", () => {
    expect(bookTrigger(899)).toBe(0.3)
    expect(bookTrigger(900)).toBe(0.25)
    expect(activeSection([0, 2000], 1800 + 800 * bookTrigger(1200))).toBe(1)
    expect(activeSection([0, 2000], 1799 + 800 * bookTrigger(1200))).toBe(0)
  })

  it("keeps the camera still until Praise reaches the viewport bottom", () => {
    const args = [1200, 800, [0, 4000], [2000, 6000], [1200, 1000]] as const
    const camera = (scroll: number) =>
      journeyCamera(
        0,
        scroll,
        args[0],
        args[1],
        [...args[2]],
        [...args[3]],
        [...args[4]]
      )
    expect(camera(1199).local).toBe(0)
    expect(camera(1200).local).toBe(0)
    expect(camera(1500).local).toBe(300)
    const second = journeyCamera(
      1,
      6000,
      1200,
      800,
      [0, 4000],
      [2000, 6000],
      [1200, 1000]
    )
    expect(second.previous).toBe(2000)
    expect(second.scroll).toBe(2800)
    expect(second.ratio).toBeCloseTo((0.027 / (800 / 1018)) * second.scale)
    const mobile = journeyCamera(
      1,
      4200,
      393,
      851,
      [0, 4000],
      [2000, 6000],
      [1200, 1000]
    )
    expect(mobile.previous).toBe(4000)
    expect(mobile.local).toBe(200)
  })
  it("estimates reading time from pages and keeps audio durations", () => {
    expect(tripSeconds({ type: "ebook", pages: 100 })).toBe(
      100 * SECONDS_PER_PAGE
    )
    expect(tripSeconds({ type: "ebook" })).toBeUndefined()
    expect(tripSeconds({ type: "audiobook", durationSeconds: 3600 })).toBe(3600)
  })

  it("book depth grows with length, within realistic hardcover bounds", () => {
    expect(bookDepth({ type: "ebook", pages: 10 })).toBe(MIN_DEPTH)
    expect(bookDepth({ type: "ebook", pages: 5000 })).toBe(MAX_DEPTH)
    expect(bookDepth({ type: "ebook", pages: 400 })).toBeGreaterThan(
      bookDepth({ type: "ebook", pages: 120 })
    )
  })

  it("the active section contains the line", () => {
    const tops = [100, 1000, 2500]
    expect(activeSection(tops, 0)).toBe(0)
    expect(activeSection(tops, 999)).toBe(0)
    expect(activeSection(tops, 1000)).toBe(1)
    expect(activeSection(tops, 9000)).toBe(2)
    expect(activeSection([], 50)).toBe(0)
  })
})

describe("book turning", () => {
  it("settles the short way round, from any number of turns", () => {
    expect(nearestTurn(22, 22)).toBe(22)
    expect(nearestTurn(22 + 720, 22)).toBe(22)
    expect(nearestTurn(400, 22)).toBe(40)
    expect(nearestTurn(-300, 22)).toBe(60)
    expect(nearestTurn(200, 22)).toBe(200)
    expect(nearestTurn(203, 22)).toBe(-157)
    expect(Math.abs(nearestTurn(1234.5, -72) - -72)).toBeLessThanOrEqual(180)
  })
})

describe("adventure views", () => {
  const views = getAdventures().map(toAdventureView)

  it("are serializable and slim", () => {
    expect(JSON.parse(JSON.stringify(views))).toEqual(views)
    expect(Object.keys(views[0].book)).not.toContain("description")
  })

  it("have three route stops, short reviews and a track for audiobooks", () => {
    for (const view of views) {
      expect(view.route).toHaveLength(3)
      expect(view.reviews.length).toBeLessThanOrEqual(3)
      for (const review of view.reviews) {
        expect(review.text.length).toBeLessThanOrEqual(251)
      }
      expect(Boolean(view.track)).toBe(view.book.type === "audiobook")
      expect(view.depth).toBeGreaterThanOrEqual(MIN_DEPTH)
      expect(view.depth).toBeLessThanOrEqual(MAX_DEPTH)
    }
  })

  it("the category map covers every adventure book", () => {
    const map = getCategoryMap()
    for (const view of views) {
      expect(map[String(view.id)]).toBe(view.categorySlug)
    }
  })
})

describe("adventure rooms", () => {
  it("contrast math matches WCAG", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1)
    expect(contrastRatio("#777777", "#777777")).toBe(1)
    expect(hexToOklch("#ffffff").l).toBeCloseTo(1, 3)
    expect(oklchToHex(hexToOklch("#3a7bd5"))).toBe("#3a7bd5")
  })

  it("every room keeps body and muted text readable (WCAG AA)", () => {
    const adventures = getAdventures()
    expect(adventures.length).toBeGreaterThan(0)
    for (const { palette, book } of adventures) {
      const room = roomColors(palette)
      for (const background of [room.top, room.bottom]) {
        const label = `${book.id} ${room.tone} ${background}`
        expect(
          contrastRatio(room.ink, background),
          label
        ).toBeGreaterThanOrEqual(7)
        expect(
          contrastRatio(room.mutedInk, background),
          label
        ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it("dark covers get dark rooms with light ink, light covers the reverse", () => {
    const dark = roomColors({ top: "#1b1a1a", bottom: "#222222" })
    expect(dark.tone).toBe("dark")
    expect(dark.ink).toBe(LIGHT_INK)
    const light = roomColors({ top: "#e6e8e8", bottom: "#dcd7d3" })
    expect(light.tone).toBe("light")
    expect(light.ink).toBe(DARK_INK)
    // Mid-tones are pushed into a readable range, never left in the middle.
    const mid = roomColors({ top: "#888888", bottom: "#7a7a7a" })
    expect(contrastRatio(mid.ink, mid.bottom)).toBeGreaterThanOrEqual(7)
    expect(mid.vars["--foreground"]).toBe(mid.ink)
  })
})
