import { expect, test } from "./fixtures"
import path from "node:path"

test("journey ends with an immersive listening stage and paper return", async ({
  page,
}) => {
  await page.goto("/adventures/4339")
  const ending = page.locator("[data-journey-ending]")
  await ending
    .getByRole("heading", { name: "سفر را بشنوید" })
    .scrollIntoViewIfNeeded()
  await expect(ending.locator("[data-listening-backdrop]")).toHaveCSS(
    "position",
    "sticky"
  )
  await expect(
    ending.getByRole("button", { name: "شنیدن نمونهٔ رایگان" })
  ).toBeVisible()
  const historyLength = await page.evaluate(() => history.length)
  await ending
    .getByRole("heading", { name: "سفر بعدی‌تان از کدام کتاب شروع می‌شود؟" })
    .scrollIntoViewIfNeeded()
  await expect(
    ending.getByRole("link", { name: "بازگشت به قفسه" })
  ).toHaveAttribute("href", "/#adventure-shelf")
  expect(await page.evaluate(() => history.length)).toBe(historyLength)
  await expect(page.locator("[data-adventure-canvas]")).toHaveCSS(
    "clip-path",
    "inset(0px 0px 100%)"
  )
  await ending.getByRole("link", { name: "بازگشت به قفسه" }).click()
  await expect(page).toHaveURL(/\/#adventure-shelf$/)
  await expect(
    page.getByRole("heading", { name: "سفر ماجراجویی شما" })
  ).toBeInViewport()
})

test("listening sample uses the real player without changing the route", async ({
  page,
}) => {
  await page.route("**/*", (route) =>
    route.request().resourceType() === "media"
      ? route.fulfill({
          path: path.resolve("e2e/assets/silence.mp3"),
          contentType: "audio/mpeg",
        })
      : route.fallback()
  )
  await page.goto("/adventures/4339")
  const ending = page.locator("[data-journey-ending]")
  const play = ending.getByRole("button", { name: "شنیدن نمونهٔ رایگان" })
  await play.scrollIntoViewIfNeeded()
  const length = await page.evaluate(() => history.length)
  await play.click()
  await expect(page.getByRole("region", { name: "پخش‌کننده" })).toBeVisible()
  await expect(
    ending.getByRole("button", { name: "توقف", exact: true })
  ).toHaveAttribute("aria-pressed", "true")
  await expect
    .poll(() =>
      page.evaluate(() => document.querySelector("audio")?.currentTime ?? 0)
    )
    .toBeGreaterThan(0)
  expect(await page.evaluate(() => history.length)).toBe(length)
})

test("phone ending fits and scrolls back from paper to the listening stage", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 851 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/adventures/4339")
  const ending = page.locator("[data-journey-ending]")
  await ending.locator("[data-journey-paper]").scrollIntoViewIfNeeded()
  const length = await page.evaluate(() => history.length)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    393
  )
  await ending
    .getByRole("heading", { name: "سفر را بشنوید" })
    .scrollIntoViewIfNeeded()
  await expect(
    ending.getByRole("button", { name: "شنیدن نمونهٔ رایگان" })
  ).toBeInViewport()
  expect(await page.evaluate(() => history.length)).toBe(length)
})
