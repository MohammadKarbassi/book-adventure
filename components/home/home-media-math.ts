const clamp = (value: number) => Math.max(0, Math.min(1, value))
export const POSTER_HEIGHT = 15 / 11

/** Local responsive choreography, not Stripe's pixel coefficients. */
export function posterOpening(top: number, viewport: number, reduced: boolean) {
  if (reduced || viewport <= 0) return 1
  return clamp((viewport * 1.05 - top) / (viewport * 1.25))
}

/** 180ms exponential settling; no overshoot or scroll interception. */
export function settlePosterOpening(
  current: number,
  target: number,
  dt: number
) {
  if (Math.abs(target - current) < 0.0005) return target
  return current + (target - current) * (1 - Math.exp(-Math.max(0, dt) / 180))
}

/** Five connected leaves and a center crease; independently authored geometry. */
export function foldPosterPoint(x: number, y: number, opening: number) {
  const angle = (1 - clamp(opening)) * 1.15
  const half = POSTER_HEIGHT / 2
  const leafHeight = POSTER_HEIGHT / 5
  const length = Math.max(0, Math.min(POSTER_HEIGHT, y + half))
  const leaf = Math.min(4, Math.floor(length / leafHeight))
  const local = length - leaf * leafHeight
  const center = (1 - clamp(opening)) * 0.12
  return {
    x: x * Math.cos(center),
    y: (length - half) * Math.cos(angle),
    z:
      ((leaf % 2 === 0 ? local : leafHeight - local) - leafHeight / 2) *
        Math.sin(angle) +
      (0.5 - Math.abs(x)) * Math.sin(center),
  }
}

export function podcastReveal(top: number, viewport: number) {
  const pixels = Math.max(0, Math.min(viewport, viewport - top))
  return { pixels, progress: viewport > 0 ? pixels / viewport : 0 }
}
