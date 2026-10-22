import { expect, test } from "./fixtures"

test("foreign teaser has readable text and three linked book previews", async ({
  page,
}) => {
  await page.goto("/")
  const region = page.getByRole("region", {
    name: "کتاب‌های خارجی، به زبان اصلی",
  })
  await region.scrollIntoViewIfNeeded()
  const header = await region.locator('[data-slot="card-header"]').boundingBox()
  expect(header!.width).toBeGreaterThan(400)
  const previews = region.getByRole("list", {
    name: "پیش‌نمایش کتاب‌های خارجی",
  })
  await expect(previews.getByRole("link")).toHaveCount(3)
  await expect(previews.getByRole("img")).toHaveCount(3)
  await expect(previews.getByRole("link").first()).toHaveAttribute(
    "href",
    "/foreign/OL8400950W"
  )
  await expect(
    region.getByRole("link", { name: "دیدن کتاب‌های خارجی" })
  ).toHaveAttribute("href", "/foreign")
  await page.setViewportSize({ width: 393, height: 851 })
  await region.scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    393
  )
  expect(
    (await region.locator('[data-slot="card-header"]').boundingBox())!.width
  ).toBeGreaterThan(300)
})
