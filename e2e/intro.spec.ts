// The intro is NOT skipped here: these tests import Playwright directly
// instead of ./fixtures (which marks the intro as seen).
import { expect, test, type Page } from "@playwright/test"

const INTRO_SEEN_KEY = "book-adventure:v1:introSeen"

// 1x1 transparent PNG served in place of external covers and artwork.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
)
const EXTERNAL_IMAGES =
  /^https:\/\/(cdn\.fidibo\.com|[^/]+\.mzstatic\.com|covers\.openlibrary\.org)\//

test.beforeEach(async ({ page }) => {
  await page.route(EXTERNAL_IMAGES, (route) =>
    route.fulfill({ contentType: "image/png", body: PIXEL })
  )
})

const intro = (page: Page) =>
  page.getByRole("dialog", { name: "معرفی ماجراجویی با کتاب" })

const storedSeen = (page: Page) =>
  page.evaluate((key) => window.localStorage.getItem(key), INTRO_SEEN_KEY)

test.describe("cinematic intro", () => {
  test("shows on the first visit and «رد شدن» skips it for good", async ({
    page,
  }) => {
    // The first dev-server compile of "/" can be slow.
    await page.goto("/", { timeout: 120_000 })
    await expect(intro(page)).toBeVisible()
    await expect(intro(page).getByText("هر کتاب")).toBeVisible()
    const skip = intro(page).getByRole("button", { name: "رد شدن" })
    await expect(skip).toBeVisible()

    await skip.click()
    await expect(intro(page)).toHaveCount(0)
    expect(await storedSeen(page)).toBe("true")
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("")

    await page.reload()
    await expect(
      page.getByRole("heading", { level: 1, name: "سفر ماجراجویی شما" })
    ).toBeVisible()
    await expect(intro(page)).toBeHidden()
  })

  test("Escape skips it", async ({ page }) => {
    await page.goto("/", { timeout: 120_000 })
    await expect(intro(page)).toBeVisible()
    await expect(intro(page).getByText("هر کتاب")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(intro(page)).toHaveCount(0)
    expect(await storedSeen(page)).toBe("true")
  })

  for (const key of ["ArrowLeft", "a"]) {
    test(`any key ends it («${key}»)`, async ({ page }) => {
      await page.goto("/", { timeout: 120_000 })
      await expect(intro(page).getByText("هر کتاب")).toBeVisible()
      // A modifier on its own doesn't count.
      await page.keyboard.press("Shift")
      await expect(intro(page)).toBeVisible()
      await page.keyboard.press(key)
      await expect(intro(page)).toHaveCount(0)
      expect(await storedSeen(page)).toBe("true")
    })
  }

  test("ends by itself after about five seconds", async ({ page }) => {
    await page.goto("/", { timeout: 120_000 })
    await expect(intro(page).getByText("هر کتاب")).toBeVisible()
    await expect(intro(page)).toHaveCount(0, { timeout: 7_000 })
    expect(await storedSeen(page)).toBe("true")
  })

  test("never shows on other pages", async ({ page }) => {
    await page.goto("/book/6673", { timeout: 120_000 })
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.locator("[data-intro-overlay]")).toHaveCount(0)
    expect(await storedSeen(page)).toBeNull()
  })

  test("is skipped entirely with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/", { timeout: 120_000 })
    await expect(
      page.getByRole("heading", { level: 1, name: "سفر ماجراجویی شما" })
    ).toBeVisible()
    await expect(intro(page)).toBeHidden()
    await expect(page.locator("[data-intro-overlay]")).toHaveCount(0)
  })
})
