import { clearStore, expect, test } from "./fixtures"
import type { Page } from "@playwright/test"

// Links that lead from the store into the adventure journey: header nav,
// card badges, the book page entry, search, category strips and the shelf.

const ADVENTURE_ID = 4339 // «ملت عشق»
const PLAIN_ID = 1631

/** Header elements that stick out of the viewport horizontally. */
async function headerOverflow(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth
    return Array.from(document.querySelectorAll("body > header *"))
      .filter((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) return false
        return rect.right > width + 0.5 || rect.left < -0.5
      })
      .map((el) => el.outerHTML.slice(0, 120))
  })
}

test.describe("header adventure link", () => {
  test("links to the home shelf on wide screens only", async ({ page }) => {
    await page.goto("/category/history")
    const header = page.locator("body > header")
    const link = header.getByRole("link", { name: "سفر ماجراجویی" })
    await expect(link).toHaveAttribute("href", "/#adventure-shelf")
    await expect(link).toBeVisible()

    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(link).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    expect(await headerOverflow(page)).toEqual([])

    await page.setViewportSize({ width: 1024, height: 800 })
    await expect(link).toBeHidden()
    expect(await headerOverflow(page)).toEqual([])
  })
})

test.describe("book cards and book page", () => {
  test("adventure books carry a badge on their card", async ({ page }) => {
    await page.goto("/category/story-foreign")
    const adventureCard = page
      .locator(`[data-book-card][href="/book/${ADVENTURE_ID}"]`)
      .first()
    await expect(adventureCard).toContainText("ماجراجویی")
    const plainCard = page
      .locator(`[data-book-card][href="/book/6431"]`)
      .first()
    await expect(plainCard).toBeVisible()
    await expect(plainCard).not.toContainText("ماجراجویی")
  })

  test("an adventure book opens its adventure", async ({ page }) => {
    await page.goto(`/book/${ADVENTURE_ID}`)
    await expect(page.locator("[data-room-band]")).toHaveCount(1)
    const enter = page.getByRole("link", { name: /ورود به ماجرا/ })
    await expect(enter).toHaveAttribute("href", `/adventures/${ADVENTURE_ID}`)
    await enter.click()
    await expect(page).toHaveURL(new RegExp(`/adventures/${ADVENTURE_ID}$`))
  })

  test("a plain book has no adventure entry", async ({ page }) => {
    await page.goto(`/book/${PLAIN_ID}`)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(page.locator("[data-room-band]")).toHaveCount(0)
    await expect(page.getByText("ورود به ماجرا")).toHaveCount(0)
  })
})

test.describe("search finds adventures", () => {
  test("the search page lists matching adventures", async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent("سفر")}`)
    const section = page.locator("section", {
      has: page.getByRole("heading", { name: /ماجراجویی‌ها/ }),
    })
    await expect(section).toBeVisible()
    await expect(
      section.locator('a[href^="/adventures/"]').first()
    ).toBeVisible()
  })

  test("command search shows an adventures group", async ({ page }) => {
    await page.goto("/category/history")
    await page.keyboard.press("ControlOrMeta+k")
    const input = page.getByPlaceholder("جستجوی کتاب، نویسنده، گوینده…")
    await expect(input).toBeVisible()
    await input.fill("سفر")
    const group = page.getByRole("group", { name: "ماجراجویی‌ها" })
    await expect(group).toBeVisible()
    await group.getByRole("option").first().click()
    await expect(page).toHaveURL(/\/adventures\/\d+$/)
  })
})

test.describe("category adventures strip", () => {
  test("a category with adventures shows them", async ({ page }) => {
    await page.goto("/category/story-foreign")
    const strip = page.locator("section", {
      has: page.getByRole("heading", { name: /ماجراهای این قفسه/ }),
    })
    await expect(strip).toBeVisible()
    await expect(strip.locator('a[href^="/adventures/"]').first()).toBeVisible()
  })

  test("a category without adventures hides the strip", async ({ page }) => {
    await page.goto("/category/history")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await expect(
      page.getByRole("heading", { name: /ماجراهای این قفسه/ })
    ).toHaveCount(0)
  })
})

test.describe("shelf to adventure", () => {
  const firstShelfLink = (page: Page) =>
    page.getByRole("list", { name: "قفسهٔ منتخب" }).getByRole("link").first()

  test("a shelf book wipes into its adventure and Back clears the wipe", async ({
    page,
  }) => {
    await page.goto("/")
    await clearStore(page)
    await page.reload()
    const link = firstShelfLink(page)
    const href = await link.getAttribute("href")
    expect(href).toMatch(/^\/adventures\/\d+$/)
    await link.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: 3000 })
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(firstShelfLink(page)).toBeVisible()
    await expect(page.locator("[data-adventure-wipe]")).toHaveCount(0)
  })

  test("reduced motion navigates directly", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const link = firstShelfLink(page)
    const href = await link.getAttribute("href")
    await link.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: 3000 })
    await expect(page.locator("[data-adventure-wipe]")).toHaveCount(0)
  })
})

test("curated home rows leave out the sensitive title", async ({ page }) => {
  await page.goto("/")
  const store = page.locator("#store")
  await expect(store).toBeAttached()
  await expect(store.getByText("مغازه خودکشی")).toHaveCount(0)
})
