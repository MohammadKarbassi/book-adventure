// Each adventure is a full-color "room" painted from its cover palette, with
// its own ink. Colors are shaped in OKLCH so text contrast never depends on
// the cover: light rooms stay light enough for navy ink, dark rooms dark
// enough for cream ink. Pure: server, client and tests share it.

export type RoomTone = "light" | "dark"

export type Room = {
  tone: RoomTone
  /** Background gradient ends, "#rrggbb". */
  top: string
  bottom: string
  ink: string
  mutedInk: string
  /** Theme tokens re-scoped to the room (set as inline CSS variables). */
  vars: Record<string, string>
}

/** Ink colors, close to the theme's own foregrounds. */
export const DARK_INK = "#1d2333"
export const LIGHT_INK = "#f6efe1"

type Rgb = [number, number, number]
type Oklch = { l: number; c: number; h: number }

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "")
  const full =
    value.length === 3
      ? value
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : value
  return [0, 2, 4].map(
    (index) => parseInt(full.slice(index, index + 2), 16) / 255
  ) as Rgb
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb
    .map((channel) =>
      Math.round(clamp(channel, 0, 1) * 255)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`
}

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const fromLinear = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { l: L, c: Math.hypot(A, B), h: Math.atan2(B, A) }
}

export function oklchToHex({ l, c, h }: Oklch): string {
  const A = c * Math.cos(h)
  const B = c * Math.sin(h)
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3
  const rgb: Rgb = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  return rgbToHex(rgb.map((channel) => fromLinear(clamp(channel, 0, 1))) as Rgb)
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1..21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Linear mix in sRGB: t = 0 → a, 1 → b. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex(
    ca.map((channel, index) => channel + (cb[index] - channel) * t) as Rgb
  )
}

// Lightness and chroma bounds per tone: rich color, readable text.
const LIGHT = { top: [0.82, 0.95], bottom: [0.76, 0.93], chroma: 0.12 }
const DARK = { top: [0.2, 0.36], bottom: [0.16, 0.3], chroma: 0.1 }

/** Mid-tones lean light unless they are clearly dark. */
const DARK_BELOW = 0.56

const alpha = (color: string, percent: number) =>
  `color-mix(in oklab, ${color} ${percent}%, transparent)`

export function roomColors(palette: { top: string; bottom: string }): Room {
  const top = hexToOklch(palette.top)
  const bottom = hexToOklch(palette.bottom)
  const tone: RoomTone = (top.l + bottom.l) / 2 < DARK_BELOW ? "dark" : "light"
  const bounds = tone === "light" ? LIGHT : DARK
  const shape = (color: Oklch, [min, max]: number[]) =>
    oklchToHex({
      l: clamp(color.l, min, max),
      c: Math.min(color.c, bounds.chroma),
      h: color.h,
    })
  const topHex = shape(top, bounds.top)
  const bottomHex = shape(bottom, bounds.bottom)

  const ink = tone === "light" ? DARK_INK : LIGHT_INK
  // Muted ink: as soft as possible while keeping 4.5:1 on both ends.
  let mutedInk = ink
  for (const t of [0.4, 0.34, 0.28, 0.22, 0.16, 0.1]) {
    const candidate = mixHex(ink, mixHex(topHex, bottomHex, 0.5), t)
    if (
      contrastRatio(candidate, topHex) >= 4.6 &&
      contrastRatio(candidate, bottomHex) >= 4.6
    ) {
      mutedInk = candidate
      break
    }
  }

  const surface = mixHex(topHex, bottomHex, 0.5)
  return {
    tone,
    top: topHex,
    bottom: bottomHex,
    ink,
    mutedInk,
    vars: {
      "--background": surface,
      "--foreground": ink,
      "--card": surface,
      "--card-foreground": ink,
      "--muted": alpha(ink, 8),
      "--muted-foreground": mutedInk,
      "--secondary": alpha(ink, 8),
      "--secondary-foreground": ink,
      "--accent": alpha(ink, 10),
      "--accent-foreground": ink,
      "--border": alpha(ink, 22),
      "--input": alpha(ink, 28),
    },
  }
}
