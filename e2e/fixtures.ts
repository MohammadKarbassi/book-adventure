import { test as base, expect, type Page } from "@playwright/test"

export const STORAGE_PREFIX = "book-adventure:v1:"
const INTRO_SEEN_KEY = `${STORAGE_PREFIX}introSeen`

/**
 * `page` with the cinematic intro already marked as seen, set before any
 * page script runs so the overlay never blocks a test.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript((key) => {
      try {
        window.localStorage.setItem(key, "true")
      } catch {
        // Storage unavailable (e.g. about:blank); nothing to skip then.
      }
    }, INTRO_SEEN_KEY)
    await provide(page)
  },
})

export { expect }

/** Removes the app's stored data (favorites, purchases, ...) but keeps the intro skipped. */
export async function clearStore(page: Page): Promise<void> {
  await page.evaluate(
    ({ prefix, introKey }) => {
      const keys = Object.keys(window.localStorage).filter(
        (key) => key.startsWith(prefix) && key !== introKey
      )
      for (const key of keys) window.localStorage.removeItem(key)
    },
    { prefix: STORAGE_PREFIX, introKey: INTRO_SEEN_KEY }
  )
}
