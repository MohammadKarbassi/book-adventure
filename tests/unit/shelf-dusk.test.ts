import { describe, expect, it } from "vitest"

import { LAMP_PEAK, lampShare } from "@/components/home/shelf-dusk"

describe("lampShare", () => {
  it("is dark at both ends, so the endpoints stay paper and night", () => {
    expect(lampShare(0)).toBe(0)
    expect(lampShare(1)).toBe(0)
  })

  it("peaks at the lantern share a third of the way into the dusk", () => {
    expect(lampShare(1 / 3)).toBeCloseTo(LAMP_PEAK, 10)
    for (const d of [0.1, 0.2, 0.3, 0.4, 0.6, 0.8])
      expect(lampShare(d)).toBeLessThan(LAMP_PEAK)
  })

  it("glows early and fades before the night", () => {
    expect(lampShare(0.1)).toBeLessThan(lampShare(0.25))
    expect(lampShare(0.5)).toBeGreaterThan(lampShare(0.8))
    expect(lampShare(0.9)).toBeLessThan(0.03)
  })

  it("clamps progress outside 0..1", () => {
    expect(lampShare(-1)).toBe(0)
    expect(lampShare(2)).toBe(0)
  })
})
