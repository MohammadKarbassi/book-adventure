import { describe, expect, it } from "vitest"

import { endingPicks } from "@/components/adventures/ending-picks"
import {
  contrastRatio,
  roomColors,
  roomGradient,
} from "@/components/adventures/room-colors"

const item = (id: number, categoryTitle?: string) => ({
  id,
  categorySlug: `cat-${id}`,
  book: { categoryTitle },
})

describe("endingPicks", () => {
  it("offers the first other rooms and the last room's category", () => {
    const items = [item(1), item(2), item(3), item(4), item(5, "رمان")]
    const picks = endingPicks(items)
    expect(picks.others.map((pick) => pick.id)).toEqual([1, 2, 3])
    expect(picks.category).toEqual({ slug: "cat-5", title: "رمان" })
  })

  it("never offers the last room, even in a short journey", () => {
    const picks = endingPicks([item(7), item(8, "تاریخ")])
    expect(picks.others.map((pick) => pick.id)).toEqual([7])
  })

  it("handles an empty journey and a category without a title", () => {
    expect(endingPicks([])).toEqual({ others: [], category: undefined })
    expect(endingPicks([item(1), item(2)]).category).toBeUndefined()
  })
})

describe("room style helpers", () => {
  it("paint the room gradient with its readable tokens", () => {
    const room = roomColors({ top: "#264653", bottom: "#1d3557" })
    expect(roomGradient(room)).toBe(
      `linear-gradient(to bottom, ${room.top}, ${room.bottom})`
    )
    expect(room.vars["--foreground"]).toBe(room.ink)
    expect(
      contrastRatio(room.vars["--muted-foreground"], room.top)
    ).toBeGreaterThanOrEqual(4.5)
  })
})
