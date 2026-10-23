import { expect, test } from "./fixtures"

// Regression: the book header was squeezed into a narrow implicit grid
// column on phones, wrapping the title word by word.
test("an adventure book's title spans the phone width", async ({ page }) => {
  await page.goto("/book/4339")
  await page.evaluate(() => document.fonts.ready)
  const title = page.getByRole("heading", { level: 1, name: "ملت عشق" })
  await expect(title).toBeVisible()
  // The header centers its children, so a short title is only as wide as
  // its words; the column it sits in must span the phone.
  const column = page.locator("header", { has: title }).first()
  const columnBox = await column.boundingBox()
  expect(columnBox!.width).toBeGreaterThanOrEqual(250)
  const box = await title.boundingBox()
  const width = await page.evaluate(() => document.documentElement.clientWidth)
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(width + 0.5)
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
