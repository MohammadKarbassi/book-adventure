import { test, expect } from "./fixtures"

test("home introduces the brand before the adventure shelf", async ({
  page,
}) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { level: 1, name: /ماجراجویی.*با کتاب/ })
  ).toBeVisible()
  await page.getByRole("link", { name: "سفرتان را انتخاب کنید" }).click()
  await expect(
    page.getByRole("heading", { level: 2, name: "سفر ماجراجویی شما" })
  ).toBeVisible()
})

test("shop books lift before navigation and preserve Back", async ({
  page,
}) => {
  await page.goto("/audiobooks")
  const card = page.locator("[data-book-card]").first()
  const href = await card.getAttribute("href")
  await card.hover()
  await expect
    .poll(() =>
      card
        .locator("[data-book-card-object]")
        .evaluate((el) => getComputedStyle(el).transform)
    )
    .not.toBe("none")
  const historyLength = await page.evaluate(() => history.length)
  await page.evaluate(() => {
    const observer = new MutationObserver(() => {
      if (document.querySelector("[data-book-flight]")) {
        document.documentElement.dataset.flightObserved = "true"
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true })
  })
  await card.click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(page.locator("html")).toHaveAttribute(
    "data-flight-observed",
    "true"
  )
  expect(await page.evaluate(() => history.length)).toBe(historyLength + 1)
  await expect(page.locator("[data-book-flight]")).toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL(/\/audiobooks$/)
})

test("reduced motion keeps immediate native book navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/audiobooks")
  const card = page.locator("[data-book-card]").first()
  const href = await card.getAttribute("href")
  await card.hover()
  await expect(card.locator("[data-book-card-object]")).toHaveCSS(
    "transform",
    "none"
  )
  await card.click()
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  await expect(page.locator("[data-book-flight]")).toHaveCount(0)
})
