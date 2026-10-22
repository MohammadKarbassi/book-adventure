import type { CSSProperties } from "react"

// Paper colors of the reader pages. Raw colors are deliberate here: they are
// the printed page itself, not site chrome, and stay the same in dark mode.

export type PageTheme = "paper" | "amber" | "night"

type ThemeVars = {
  "--paper": string
  "--paper-edge": string
  "--ink": string
  "--ink-muted": string
  "--ornament": string
  /** Strength of the gutter shadow toward the spine (0–1). */
  "--gutter": string
}

export const PAGE_THEMES: Record<
  PageTheme,
  { label: string; swatch: string; vars: ThemeVars }
> = {
  paper: {
    label: "کاغذی",
    swatch: "#fbf6ea",
    vars: {
      "--paper": "#fbf6ea",
      "--paper-edge": "#e2d6bd",
      "--ink": "#292a33",
      "--ink-muted": "#8a8070",
      "--ornament": "#a8742a",
      "--gutter": "0.16",
    },
  },
  amber: {
    label: "کهربایی",
    swatch: "#f0dbb2",
    vars: {
      "--paper": "#f0dbb2",
      "--paper-edge": "#d3b886",
      "--ink": "#3d2a17",
      "--ink-muted": "#86663f",
      "--ornament": "#94561b",
      "--gutter": "0.2",
    },
  },
  night: {
    label: "شب",
    swatch: "#1f2129",
    vars: {
      "--paper": "#1f2129",
      "--paper-edge": "#3a3d48",
      "--ink": "#cdc6b6",
      "--ink-muted": "#80796d",
      "--ornament": "#c9a15a",
      "--gutter": "0.5",
    },
  },
}

export const PAGE_THEME_IDS = Object.keys(PAGE_THEMES) as PageTheme[]

export function isPageTheme(value: unknown): value is PageTheme {
  return typeof value === "string" && value in PAGE_THEMES
}

export function themeStyle(theme: PageTheme): CSSProperties {
  return PAGE_THEMES[theme].vars as CSSProperties
}
