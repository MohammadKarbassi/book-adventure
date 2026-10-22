import { describe, expect, it } from "vitest"
import {
  foldPosterPoint,
  posterOpening,
  POSTER_HEIGHT,
  podcastReveal,
} from "@/components/home/home-media-math"

describe("home poster folding", () => {
  it("opens with scroll and clamps both ends", () => {
    expect(posterOpening(900, 900, false)).toBe(0)
    expect(posterOpening(-100, 900, false)).toBe(1)
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
  it("splits the same viewport between poster and podcast scenes", () => {
    expect(podcastReveal(900, 900)).toEqual({ pixels: 0, progress: 0 })
    expect(podcastReveal(450, 900)).toEqual({ pixels: 450, progress: 0.5 })
    expect(podcastReveal(-100, 900)).toEqual({ pixels: 900, progress: 1 })
    expect(podcastReveal(0, 0)).toEqual({ pixels: 0, progress: 0 })
  })
})
