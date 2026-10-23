import { describe, expect, it } from "vitest"

import { isActivePath, mainLinks } from "@/components/site/nav-config"
import { matchAdventures } from "@/lib/adventure-search"
import { getAdventureSearchItems } from "@/lib/adventure-search-items"
import { getAllBooks, getBook, toSummary } from "@/lib/catalog"

describe("adventure flag on summaries", () => {
  it("is true for an adventure book and absent otherwise", () => {
    expect(toSummary(getBook(4339)!).adventure).toBe(true)
    const other = getAllBooks().find(
      (book) => !getAdventureSearchItems().some((a) => a.bookId === book.id)
    )!
    expect(toSummary(other).adventure).toBeFalsy()
  })
})

describe("adventure search", () => {
  const items = getAdventureSearchItems()

  it("finds adventures for «سفر» and ignores an empty query", () => {
    expect(matchAdventures(items, "سفر").length).toBeGreaterThanOrEqual(1)
    expect(matchAdventures(items, "  ")).toEqual([])
  })

  it("treats Arabic letter variants like Persian ones", () => {
    const persian = matchAdventures(items, "چهل قاعده")
    expect(persian.map((a) => a.bookId)).toContain(4339)
    // Arabic yeh/kaf variants of a Persian query give the same result.
    expect(matchAdventures(items, "ماجراجويي")).toEqual(
      matchAdventures(items, "ماجراجویی")
    )
    expect(matchAdventures(items, "كتاب")).toEqual(
      matchAdventures(items, "کتاب")
    )
  })
})

describe("journey nav link", () => {
  const journey = mainLinks[0]

  it("is the first main link and points at the home shelf", () => {
    expect(journey.href).toBe("/#adventure-shelf")
  })

  it("is active on adventure routes, not on home", () => {
    expect(isActivePath("/adventures/4339", journey.href)).toBe(true)
    expect(isActivePath("/", journey.href)).toBe(false)
    expect(isActivePath("/audiobooks", journey.href)).toBe(false)
  })
})
