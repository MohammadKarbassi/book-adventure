import type { Locator, Page } from "@playwright/test"

import { expect, test } from "./fixtures"

// The first dev-server compile of a route can be slow.
test.describe.configure({ timeout: 90_000 })

/** «۵ کتاب از ۱۷» next to the filters. */
const resultCount = (page: Page) =>
  page.getByRole("main").getByText(/^[۰-۹]+ کتاب( از [۰-۹]+)?$/)

const bookCards = (page: Page) =>
  page.getByRole("main").locator('a[href^="/book/"]')

/** Final price of a book card in Toman («رایگان» is 0). */
async function cardPrice(card: Locator): Promise<number> {
  const text = await card.innerText()
  if (/رایگان/.test(text) && !/تومان/.test(text)) return 0
  const match = text.match(/([۰-۹0-9٬,]+)\s*تومان/)
  if (!match) throw new Error(`No price in card: ${text}`)
  const latin = match[1]
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٬,]/g, "")
  return Number(latin)
}

async function expectEveryCard(page: Page, text: string) {
  const cards = bookCards(page)
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
  for (let index = 0; index < count; index++) {
    await expect(cards.nth(index)).toContainText(text)
  }
}

test.describe("category page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/category/psychology", { timeout: 60_000 })
    await expect(
      page.getByRole("heading", { level: 1, name: "روانشناسی" })
    ).toBeVisible()
    await page.waitForLoadState("load")
  })

  test("lists the category's books with a breadcrumb", async ({ page }) => {
    await expect(bookCards(page).first()).toBeVisible()
    expect(await bookCards(page).count()).toBeGreaterThan(5)
    const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" })
    await expect(
      breadcrumb.getByRole("link", { name: "دسته‌بندی‌ها" })
    ).toHaveAttribute("href", "/categories")
    await expect(page).toHaveTitle(/روانشناسی/)
  })

  test("«صوتی» shows only audiobooks and updates the URL", async ({ page }) => {
    await page
      .getByRole("group", { name: "نوع کتاب" })
      .getByRole("button", { name: "صوتی", exact: true })
      .click()
    await expect(page).toHaveURL(/type=audio/)
    await expect(resultCount(page)).toContainText("کتاب از")
    await expectEveryCard(page, "صوتی")
  })

  test("sorting by «ارزان‌ترین» puts the cheaper book first", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /مرتب‌سازی/ }).click()
    await page.getByRole("menuitemradio", { name: "ارزان‌ترین" }).click()
    await expect(page).toHaveURL(/sort=cheapest/)
    await expect(page.getByRole("button", { name: /ارزان‌ترین/ })).toBeVisible()
    const cards = bookCards(page)
    const first = await cardPrice(cards.nth(0))
    const second = await cardPrice(cards.nth(1))
    expect(first).toBeLessThanOrEqual(second)
  })

  test("«فقط اشتراکی» shows only subscription books", async ({ page }) => {
    await page.getByRole("button", { name: "فقط اشتراکی" }).click()
    await expect(page).toHaveURL(/plus=1/)
    await expect(resultCount(page)).toContainText("کتاب از")
    await expectEveryCard(page, "اشتراکی")
  })

  test("filters survive a reload and can be cleared", async ({ page }) => {
    await page.goto(
      "/category/psychology?type=audio&plus=1&sub=psychology-social-relations"
    )
    await expect(page.getByText("کتابی با این فیلترها پیدا نشد")).toBeVisible()
    await page.getByRole("button", { name: "پاک کردن فیلترها" }).click()
    await expect(page).toHaveURL(/\/category\/psychology$/)
    await expect(bookCards(page).first()).toBeVisible()
  })
})

test.describe("search page", () => {
  test("finds «سقوط» from the search form", async ({ page }) => {
    await page.goto("/search", { timeout: 60_000 })
    await expect(
      page.getByRole("heading", { name: "دنبال چه کتابی هستید؟" })
    ).toBeVisible()
    await page.waitForLoadState("load")
    const input = page.getByRole("searchbox", { name: "عبارت جستجو" })
    await input.fill("سقوط")
    await input.press("Enter")
    await expect(page).toHaveURL(/\/search\?q=/)
    await expect(
      page.getByRole("heading", { level: 1, name: /نتیجه‌های جستجو برای/ })
    ).toBeVisible()
    await expect(
      bookCards(page).filter({ hasText: "سقوط" }).first()
    ).toBeVisible()
  })

  test("Arabic letters «كيمياگر» find «کیمیاگر»", async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent("كيمياگر")}`, {
      timeout: 60_000,
    })
    await expect(
      bookCards(page).filter({ hasText: "کیمیاگر" }).first()
    ).toBeVisible()
  })

  test("a nonsense query shows «نتیجه‌ای پیدا نشد»", async ({ page }) => {
    await page.goto("/search?q=zzqxwv", { timeout: 60_000 })
    await expect(
      page.getByRole("heading", { name: "نتیجه‌ای پیدا نشد" })
    ).toBeVisible()
    await expect(bookCards(page)).toHaveCount(0)
  })
})

test("/audiobooks shows audiobook cards", async ({ page }) => {
  await page.goto("/audiobooks", { timeout: 60_000 })
  await expect(
    page.getByRole("heading", { level: 1, name: "کتاب‌های صوتی" })
  ).toBeVisible()
  const top = page.getByRole("region", { name: "پرشنونده‌ترین‌ها" })
  const cards = top.locator('a[href^="/book/"]')
  await expect(cards).toHaveCount(12)
  for (let index = 0; index < 12; index++) {
    await expect(cards.nth(index)).toContainText("صوتی")
  }
})

test("/categories links to a category page", async ({ page }) => {
  await page.goto("/categories", { timeout: 60_000 })
  await page.waitForLoadState("load")
  await page.getByRole("main").getByRole("link", { name: /تاریخ/ }).click()
  await expect(page).toHaveURL(/\/category\/history$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "تاریخ" })
  ).toBeVisible()
})
