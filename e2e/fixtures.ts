import { test as base, expect, type Page } from "@playwright/test"

export const STORAGE_PREFIX = "book-adventure:v1:"
const INTRO_SEEN_KEY = `${STORAGE_PREFIX}introSeen`

// 1x1 transparent PNG served in place of external covers and artwork.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
)
const EXTERNAL_IMAGES =
  /^https:\/\/(cdn\.fidibo\.com|[^/]+\.mzstatic\.com|covers\.openlibrary\.org)\//

/**
 * `page` with the cinematic intro already marked as seen, set before any
 * page script runs so the overlay never blocks a test. External images are
 * answered locally so tests don't depend on third-party CDNs.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.route(EXTERNAL_IMAGES, (route) =>
      route.fulfill({ contentType: "image/png", body: PIXEL })
    )
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
