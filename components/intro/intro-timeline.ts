// Pure pieces of the cinematic intro (no React): the lines, the timing table
// and the pre-paint script. Unit tests import this file directly.

import { storageKey } from "@/lib/storage"
import { STORE_KEYS } from "@/lib/store-core"

export const INTRO_LINES = {
  discover: "هر کتاب، یه کشف تازه",
  adventure: "یه ماجراجویی جدید",
  title: "ماجراجویی با کتاب",
  subtitle: "Book Adventure",
} as const

/** Number of suspense dots after the first line («...»). */
export const DISCOVER_DOTS = 3

/**
 * Splits Persian text into words on spaces only. Persian letters join, so
 * a word must never be split further; a ZWNJ (U+200C) stays inside its word.
 */
export function splitWords(text: string): string[] {
  return text.split(/ +/).filter(Boolean)
}

/** The steps in order; each shows one line (the title closes with "exit"). */
export const INTRO_STEPS = ["discover", "adventure", "title", "exit"] as const
export type IntroStep = (typeof INTRO_STEPS)[number]

/** How long each step lasts, in milliseconds. */
export const STEP_MS: Record<IntroStep, number> = {
  discover: 1500,
  adventure: 1000,
  title: 1300,
  exit: 900,
}

export function totalIntroMs(): number {
  return INTRO_STEPS.reduce((sum, step) => sum + STEP_MS[step], 0)
}

export function nextStep(step: IntroStep): IntroStep | null {
  const index = INTRO_STEPS.indexOf(step)
  return INTRO_STEPS[index + 1] ?? null
}

/** Value of `<html data-intro>` once the intro must not show. */
export const INTRO_SEEN_ATTR = "seen"

export const INTRO_STORAGE_KEY = storageKey(STORE_KEYS.introSeen)

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

/**
 * Runs in <head> before the first paint: returning visitors and reduced
 * motion users get `data-intro="seen"`, which hides the server-rendered
 * overlay in CSS, so they never see it flash.
 */
export const INTRO_HEAD_SCRIPT = `(function(){var d=document.documentElement;try{if(matchMedia(${JSON.stringify(REDUCED_MOTION_QUERY)}).matches)d.dataset.intro=${JSON.stringify(INTRO_SEEN_ATTR)}}catch(e){}try{if(JSON.parse(localStorage.getItem(${JSON.stringify(INTRO_STORAGE_KEY)}))===true)d.dataset.intro=${JSON.stringify(INTRO_SEEN_ATTR)}}catch(e){}})()`
