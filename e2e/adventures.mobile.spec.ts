import { expect, test } from "./fixtures"

test("mobile continuous journey uses the 30 percent trigger without growing history", async ({
  page,
}) => {
  await page.goto("/")
  const links = page
    .getByRole("list", { name: "قفسهٔ منتخب" })
    .getByRole("link")
  const first = (await links.first().getAttribute("href"))!
  const second = (await links.nth(1).getAttribute("href"))!
  const secondId = second.split("/").pop()!
  const before = await page.evaluate(() => history.length)
  await links.first().click()
  await expect(page).toHaveURL(new RegExp(`${first}$`))
  await expect(page.locator("[data-immersive]")).toHaveAttribute(
    "data-active-index",
    "0"
  )
  expect(await page.evaluate(() => history.length)).toBe(before + 1)
  const length = await page.evaluate(() => history.length)
  const top = await page
    .locator(`#adventure-${secondId}`)
    .evaluate((element) => element.getBoundingClientRect().top + scrollY)
  await page.evaluate((top) => scrollTo(0, top - innerHeight * 0.3 - 3), top)
  await expect(page.locator("[data-immersive]")).toHaveAttribute(
    "data-active-index",
    "0"
  )
  await page.evaluate((top) => scrollTo(0, top - innerHeight * 0.3 + 3), top)
  await expect(page).toHaveURL(new RegExp(`${second}$`))
  await expect(page.locator("[data-immersive]")).toHaveAttribute(
    "data-active-index",
    "1"
  )
  expect(await page.evaluate(() => history.length)).toBe(length)
  await expect(page.locator("[data-adventure-canvas]")).toHaveCSS(
    "position",
    "fixed"
  )
  await page.evaluate(() => scrollTo(0, 0))
  await expect(page).toHaveURL(new RegExp(`${first}$`))
  expect(await page.evaluate(() => history.length)).toBe(length)
  await page.evaluate((top) => scrollTo(0, top), top)
  await expect(page).toHaveURL(new RegExp(`${second}$`))
  await page.reload()
  await expect(page.locator("[data-immersive]")).toHaveAttribute(
    "data-active-index",
    "1"
  )
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await page.goForward()
  await expect(page).toHaveURL(new RegExp(`${second}$`))
  await expect(page.locator("[data-immersive]")).toHaveAttribute(
    "data-active-index",
    "1"
  )
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ).toBeLessThanOrEqual(1)
})
