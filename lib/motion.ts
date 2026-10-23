// Shared motion tokens: one easing curve and a small duration scale (seconds),
// so authored transitions across the site feel like one hand made them.

/** Quick start, long gentle settle (CSS: cubic-bezier(0.22, 1, 0.36, 1)). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export const DURATION = { fast: 0.16, base: 0.24, slow: 0.6 } as const

/** EASE_OUT as a CSS/WAAPI easing string. */
export const EASE_OUT_CSS = `cubic-bezier(${EASE_OUT.join(",")})`

/** Seconds → milliseconds, for the Web Animations API and timers. */
export const ms = (seconds: number) => Math.round(seconds * 1000)
