// The shelf's dusk: as the last books pass, the paper fades into the media
// night. A small share of the lantern (--primary) glows mid-way so the paper
// turns amber → copper → rose before the navy, instead of a flat grey.
// Pure: the scroll handler writes these shares as CSS variables.

/** Largest lantern share, reached a third of the way into the dusk. */
export const LAMP_PEAK = 0.3

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Lantern share (0..1) for a dusk progress `dim` (0 = paper, 1 = night). */
export function lampShare(dim: number): number {
  const d = clamp01(dim)
  // d(1-d)² peaks at d = 1/3 with 4/27; 27/4 normalizes the peak to 1.
  return LAMP_PEAK * 6.75 * d * (1 - d) ** 2
}
