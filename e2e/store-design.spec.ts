import { expect, test } from "./fixtures"

test("shop titles have room for two lines without shifting the price row", async ({
  page,
}) => {
  await page.goto("/category/story-persian")
  const cards = page.locator("[data-book-card]")
  await expect(cards.first()).toBeVisible()
  const heights = await cards.locator("h3").evaluateAll((titles) =>
    titles.map((title) => ({
      height: title.getBoundingClientRect().height,
      line: Number.parseFloat(getComputedStyle(title).lineHeight),
    }))
  )
  for (const title of heights)
    expect(title.height).toBeGreaterThanOrEqual(title.line * 2 - 1)
})

test("foreign books pull out from their left binding and preserve native history", async ({
  page,
}) => {
  await page.goto("/foreign")
  const card = page.locator('a[href^="/foreign/OL"]').first()
  await expect(card).toBeVisible()
  await card.focus()
  const object = card.locator(":scope > div").first()
  await expect
    .poll(() => object.evaluate((el) => getComputedStyle(el).transform))
    .toContain("matrix3d")
  expect(
    await object.evaluate((el) => getComputedStyle(el).transformOrigin)
  ).toMatch(/^0px /)
  const before = await page.evaluate(() => history.length)
  const href = await card.getAttribute("href")
  await card.press("Enter")
  await expect(page).toHaveURL(new RegExp(`${href}$`))
  expect(await page.evaluate(() => history.length)).toBe(before + 1)
  await expect(page.locator("[data-book-flight]")).toHaveCount(0)
  const cover = page.locator("[data-book-detail-object]")
  await expect(cover).toBeVisible()
  expect(await cover.evaluate((el) => getComputedStyle(el).direction)).toBe(
    "ltr"
  )
  await page.goBack()
  await expect(page).toHaveURL(/\/foreign$/)
})

test("foreign reduced-motion links keep the cover still and navigate without a flight", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/foreign")
  const card = page.locator('a[href^="/foreign/OL"]').first()
  await card.hover()
  await expect(card.locator(":scope > div").first()).toHaveCSS(
    "transform",
    "none"
  )
  await card.click()
  await expect(page).toHaveURL(/\/foreign\/OL\d+W$/)
  await expect(page.locator("[data-book-flight]")).toHaveCount(0)
})
