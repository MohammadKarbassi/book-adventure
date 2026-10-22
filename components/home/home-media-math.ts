import { HOME_POSTER } from "@/data/home-poster"

const clamp = (value: number) => Math.max(0, Math.min(1, value))
export const POSTER_HEIGHT = HOME_POSTER.height / HOME_POSTER.width

/** Local responsive choreography, not Stripe's pixel coefficients. */
export function posterOpening(top: number, viewport: number, reduced: boolean) {
  if (reduced || viewport <= 0) return 1
  return clamp((viewport * 1.05 - top) / (viewport * 1.4))
}

/** 220ms exponential settling; no overshoot or scroll interception. */
export function settlePosterOpening(
  current: number,
  target: number,
  dt: number
) {
  if (Math.abs(target - current) < 0.0005) return target
  return current + (target - current) * (1 - Math.exp(-Math.max(0, dt) / 220))
}

/** Alternating panel slopes, slightly delayed toward the bottom of the paper. */
export function posterPanelAngle(panel: number, opening: number) {
  const delay = panel * 0.045
  const progress = clamp((opening - delay) / (1 - delay))
  return (panel % 2 === 0 ? 1 : -1) * 1.3 * Math.pow(1 - progress, 0.85)
}

/** Integrate each panel's slope: continuous hinges, constant paper length. */
export function foldPosterPoint(x: number, y: number, opening: number) {
  const half = POSTER_HEIGHT / 2
  const leafHeight = POSTER_HEIGHT / 5
  const length = Math.max(0, Math.min(POSTER_HEIGHT, y + half))
  const leaf = Math.min(4, Math.floor(length / leafHeight))
  const local = length - leaf * leafHeight
  let totalY = 0
  let totalZ = 0
  let beforeY = 0
  let beforeZ = 0
  for (let panel = 0; panel < 5; panel++) {
    const angle = posterPanelAngle(panel, opening)
    const dy = leafHeight * Math.cos(angle)
    const dz = leafHeight * Math.sin(angle)
    totalY += dy
    totalZ += dz
    if (panel < leaf) {
      beforeY += dy
      beforeZ += dz
    }
  }
  const angle = posterPanelAngle(leaf, opening)
  const center = (1 - clamp(opening)) * 0.04
  return {
    x: x * Math.cos(center),
    y: beforeY + local * Math.cos(angle) - totalY / 2,
    z:
      beforeZ +
      local * Math.sin(angle) -
      totalZ / 2 +
      (0.5 - Math.abs(x)) * Math.sin(center),
  }
}

export function podcastReveal(top: number, viewport: number) {
  const pixels = Math.max(0, Math.min(viewport, viewport - top))
  return { pixels, progress: viewport > 0 ? pixels / viewport : 0 }
}
