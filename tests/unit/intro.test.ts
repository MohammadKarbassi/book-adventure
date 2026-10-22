import { describe, expect, it } from "vitest"

import {
  INTRO_HEAD_SCRIPT,
  INTRO_LINES,
  INTRO_STEPS,
  INTRO_STORAGE_KEY,
  STEP_MS,
  nextStep,
  splitWords,
  totalIntroMs,
} from "@/components/intro/intro-timeline"

const ZWNJ = "‌"

describe("splitWords", () => {
  it("splits the Persian lines into whole words", () => {
    expect(splitWords(INTRO_LINES.discover)).toEqual([
      "هر",
      "کتاب،",
      "یه",
      "کشف",
      "تازه",
    ])
    expect(splitWords(INTRO_LINES.adventure)).toEqual([
      "یه",
      "ماجراجویی",
      "جدید",
    ])
  })

  it("keeps ZWNJ words intact and ignores extra spaces", () => {
    const words = splitWords(` کتاب${ZWNJ}ها   را  می${ZWNJ}خوانم `)
    expect(words).toEqual([`کتاب${ZWNJ}ها`, "را", `می${ZWNJ}خوانم`])
    expect(words.join(" ")).not.toContain("  ")
  })
})

describe("timeline", () => {
  it("lasts about 4.5 to 5 seconds", () => {
    expect(totalIntroMs()).toBeGreaterThanOrEqual(4500)
    expect(totalIntroMs()).toBeLessThanOrEqual(5000)
  })

  it("runs the steps in order and ends after the exit", () => {
    expect(INTRO_STEPS).toEqual(["discover", "adventure", "title", "exit"])
    expect(nextStep("discover")).toBe("adventure")
    expect(nextStep("title")).toBe("exit")
    expect(nextStep("exit")).toBeNull()
    for (const step of INTRO_STEPS) expect(STEP_MS[step]).toBeGreaterThan(0)
  })
})

describe("pre-paint script", () => {
  function run({
    stored,
    reduced = false,
    storageThrows = false,
  }: {
    stored?: string | null
    reduced?: boolean
    storageThrows?: boolean
  }) {
    const dataset: Record<string, string> = {}
    const document = { documentElement: { dataset } }
    const localStorage = {
      getItem(key: string) {
        if (storageThrows) throw new Error("blocked")
        return key === INTRO_STORAGE_KEY ? (stored ?? null) : null
      },
    }
    const matchMedia = () => ({ matches: reduced })
    new Function("document", "localStorage", "matchMedia", INTRO_HEAD_SCRIPT)(
      document,
      localStorage,
      matchMedia
    )
    return dataset.intro
  }

  it("uses the store's key", () => {
    expect(INTRO_STORAGE_KEY).toBe("book-adventure:v1:introSeen")
  })

  it("marks returning visitors", () => {
    expect(run({ stored: "true" })).toBe("seen")
  })

  it("lets first-time visitors see the intro", () => {
    expect(run({ stored: null })).toBeUndefined()
    expect(run({ stored: "false" })).toBeUndefined()
    expect(run({ stored: "not json" })).toBeUndefined()
  })

  it("skips the intro with reduced motion", () => {
    expect(run({ stored: null, reduced: true })).toBe("seen")
  })

  it("survives blocked storage", () => {
    expect(run({ storageThrows: true })).toBeUndefined()
    expect(run({ storageThrows: true, reduced: true })).toBe("seen")
  })
})
