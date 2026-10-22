import { clearStore, expect, test } from "./fixtures"

// Phone-sized checks (Pixel 7 project): the main journeys must work and no
// page may scroll sideways.

async function expectNoHorizontalScroll(page: import("@playwright/test").Page) {
  // In dev, CSS arrives through JS after "load"; wait until the layout
  // styles apply (the body is a flex column) and fonts are in.
  await page.waitForFunction(
    () => getComputedStyle(document.body).display === "flex"
  )
  await page.evaluate(() => document.fonts.ready)
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await clearStore(page)
})

test("menu sheet opens and navigates to a category", async ({ page }) => {
  await page.getByRole("button", { name: "منو" }).click()
  const menu = page.getByRole("dialog")
  await expect(menu).toBeVisible()
  await menu.getByRole("link", { name: /روانشناسی/ }).click()
  await expect(page).toHaveURL(/\/category\/psychology/)
  await expect(
    page.getByRole("heading", { level: 1, name: "روانشناسی" })
  ).toBeVisible()
  await expectNoHorizontalScroll(page)
})

test("search from the header finds a book", async ({ page }) => {
  await page.getByRole("button", { name: "جستجو" }).first().click()
  await page.getByPlaceholder("جستجوی کتاب، نویسنده، گوینده…").fill("سقوط")
  await page.getByRole("option", { name: /سقوط/ }).first().click()
  await expect(page).toHaveURL(/\/book\/84590/)
})

test("a book can be bought on a phone", async ({ page }) => {
  await page.goto("/book/6673")
  await expectNoHorizontalScroll(page)
  await page.getByRole("button", { name: "خرید کتاب" }).click()
  await page.getByRole("button", { name: "پرداخت و خرید" }).click()
  await expect(page.getByText("کتاب خریداری شد").first()).toBeVisible()
})

for (const path of [
  "/",
  "/categories",
  "/audiobooks",
  "/podcasts",
  "/subscription",
  "/library",
  "/search?q=کتاب",
]) {
  test(`no sideways scroll on ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState("load")
    await expectNoHorizontalScroll(page)
  })
}
