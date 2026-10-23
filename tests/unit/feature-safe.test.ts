import { describe, expect, it } from "vitest"

import { splitAccent } from "@/lib/accent"
import { getAllBooks } from "@/lib/catalog"
import { isFeatureSafe } from "@/lib/feature-safe"

describe("isFeatureSafe", () => {
  it("rejects titles about suicide", () => {
    expect(isFeatureSafe({ title: "مغازه خودکشی" })).toBe(false)
    expect(isFeatureSafe({ title: "پیشگیری از خودکشی" })).toBe(false)
  })

  it("keeps ordinary titles", () => {
    expect(isFeatureSafe({ title: "سقوط" })).toBe(true)
  })

  it("filters the known sensitive books out of the catalog", () => {
    const unsafe = getAllBooks().filter((book) => !isFeatureSafe(book))
    expect(unsafe.length).toBeGreaterThan(0)
    for (const book of unsafe) expect(book.title).toContain("خودکشی")
  })
})

describe("splitAccent", () => {
  it("splits around a whole word", () => {
    expect(splitAccent("کتاب‌های صوتی", "صوتی")).toEqual([
      "کتاب‌های ",
      "صوتی",
      "",
    ])
    expect(splitAccent("سفر ماجراجویی شما", "ماجراجویی")).toEqual([
      "سفر ",
      "ماجراجویی",
      " شما",
    ])
  })

  it("never splits inside a word or across a ZWNJ", () => {
    expect(splitAccent("پادکست‌ها", "پادکست")).toBeNull()
    expect(splitAccent("کتاب‌های صوتی", "کتاب")).toBeNull()
    expect(splitAccent("ماجراجویی", "جویی")).toBeNull()
  })

  it("finds a later whole-word match after a partial one", () => {
    expect(splitAccent("پادکست‌ها و پادکست", "پادکست")).toEqual([
      "پادکست‌ها و ",
      "پادکست",
      "",
    ])
  })

  it("returns null without an accent", () => {
    expect(splitAccent("دسته‌بندی‌ها", undefined)).toBeNull()
    expect(splitAccent("دسته‌بندی‌ها", "")).toBeNull()
  })
})
