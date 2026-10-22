import { describe, expect, it } from "vitest"
import {
  foldPosterPoint,
  posterOpening,
  POSTER_HEIGHT,
  podcastReveal,
  settlePosterOpening,
  posterPanelAngle,
} from "@/components/home/home-media-math"

describe("home poster folding", () => {
  it("opens with scroll and clamps both ends", () => {
    expect(posterOpening(1000, 900, false)).toBe(0)
    expect(posterOpening(-200, 900, false)).toBe(1)
    expect(posterOpening(0, 900, true)).toBe(1)
    expect(posterOpening(0, 0, false)).toBe(1)
    expect(posterOpening(400, 900, false)).toBeLessThan(
      posterOpening(100, 900, false)
    )
  })
  it("is a flat portrait at full opening", () => {
    for (const y of [-POSTER_HEIGHT / 2, 0, POSTER_HEIGHT / 2]) {
      const p = foldPosterPoint(0.3, y, 1)
      expect(p.x).toBe(0.3)
      expect(p.y).toBeCloseTo(y)
      expect(p.z).toBeCloseTo(0)
    }
  })
  it("spreads unfolding over 125 percent of a viewport", () => {
    expect(posterOpening(900 * 1.05, 900, false)).toBeCloseTo(0)
    expect(posterOpening(900 * 0.425, 900, false)).toBeCloseTo(0.5)
    expect(posterOpening(-900 * 0.2, 900, false)).toBeCloseTo(1)
    expect(posterOpening(90, 900, false)).toBeLessThan(0.8)
  })
  it("settles gently without overshoot and is frame-rate independent", () => {
    const first = settlePosterOpening(0, 1, 16)
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(0.12)
    expect(settlePosterOpening(first, 1, 16)).toBeCloseTo(
      settlePosterOpening(0, 1, 32)
    )
    expect(settlePosterOpening(0.5, 0, 32)).toBeLessThan(0.5)
  })
  it("has physical depth when folded and remains continuous across creases", () => {
    expect(Math.abs(foldPosterPoint(0, -0.75, 0).z)).toBeGreaterThan(0.05)
    expect(Math.abs(foldPosterPoint(0, 0.75, 0).y)).toBeLessThan(0.75)
    for (const y of [
      -POSTER_HEIGHT / 2 + POSTER_HEIGHT / 5,
      -POSTER_HEIGHT / 2 + (POSTER_HEIGHT * 3) / 5,
    ]) {
      const a = foldPosterPoint(0, y - 0.00001, 0.2)
      const b = foldPosterPoint(0, y + 0.00001, 0.2)
      expect(Math.abs(a.y - b.y)).toBeLessThan(0.001)
      expect(Math.abs(a.z - b.z)).toBeLessThan(0.001)
    }
  })
  it("reveals four distinct alternating hinges with staggered panel opening", () => {
    const angles = Array.from({ length: 5 }, (_, i) => posterPanelAngle(i, 0.5))
    for (let i = 1; i < 5; i++) {
      expect(angles[i] * angles[i - 1]).toBeLessThan(0)
      expect(Math.abs(angles[i] - angles[i - 1])).toBeGreaterThan(1.1)
    }
    expect(Math.abs(angles[4])).toBeGreaterThan(Math.abs(angles[0]) + 0.1)
    expect(posterPanelAngle(4, 1)).toBe(0)
  })
  it("preserves paper length inside each folded panel", () => {
    const a = foldPosterPoint(0.3, -0.64, 0.4)
    const b = foldPosterPoint(0.3, -0.54, 0.4)
    expect(Math.hypot(b.y - a.y, b.z - a.z)).toBeCloseTo(0.1, 5)
  })
  it("splits the same viewport between poster and podcast scenes", () => {
    expect(podcastReveal(900, 900)).toEqual({ pixels: 0, progress: 0 })
    expect(podcastReveal(450, 900)).toEqual({ pixels: 450, progress: 0.5 })
    expect(podcastReveal(-100, 900)).toEqual({ pixels: 900, progress: 1 })
    expect(podcastReveal(0, 0)).toEqual({ pixels: 0, progress: 0 })
  })
})
