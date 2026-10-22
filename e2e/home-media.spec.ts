import { expect, test } from "./fixtures"
import path from "node:path"

test("homepage continues after its books into audio, podcast and paper shop", async ({
  page,
}) => {
  await page.goto("/")
  const audio = page.locator("#home-audio")
  await expect(audio).toHaveCount(1, { timeout: 2000 })
  const historyLength = await page.evaluate(() => history.length)
  await audio.scrollIntoViewIfNeeded()
  await expect(
    audio.getByRole("button", { name: "شنیدن نمونهٔ رایگان" })
  ).toBeVisible()
  await expect(page.locator("[data-shelf-canvas]")).toHaveCount(1)
  const podcast = page.locator("#home-podcast")
  await podcast.scrollIntoViewIfNeeded()
  await expect(
    podcast.getByRole("heading", { name: "کنجکاوی، آن سوی صفحه‌ها" })
  ).toBeVisible()
  await expect(
    podcast.getByRole("button", { name: "شنیدن پادکست" })
  ).toBeVisible()
  await page.locator("[data-home-shop-entrance]").scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => history.length)).toBe(historyLength)
  await expect(
    page.getByRole("heading", { name: "کتاب بعدی‌تان را پیدا کنید" })
  ).toBeVisible()
})

test("paper geometry opens and reverses without adding browser history", async ({
  page,
}) => {
  await page.goto("/")
  const poster = page.locator("[data-home-poster-anchor]")
  await page
    .locator("#home-audio")
    .evaluate((el) =>
      scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.45)
    )
  await expect(poster).toHaveAttribute("data-poster-ready", "true")
  await expect
    .poll(async () => Number(await poster.getAttribute("data-poster-opening")))
    .toBeCloseTo(0.48, 2)
  const folded = Number(await poster.getAttribute("data-poster-opening"))
  expect(folded).toBeGreaterThan(0.3)
  expect(folded).toBeLessThan(0.7)
  const length = await page.evaluate(() => history.length)
  await page
    .locator("#home-audio")
    .evaluate((el) =>
      scrollTo(0, el.getBoundingClientRect().top + scrollY + innerHeight * 0.2)
    )
  await expect(poster).toHaveAttribute("data-poster-opening", "1.000")
  const before = await poster.boundingBox()
  await page.evaluate(() => scrollBy(0, 80))
  await expect
    .poll(async () => (await poster.boundingBox())?.y)
    .toBeCloseTo(before!.y - 80, 0)
  await page
    .locator("#home-audio")
    .evaluate((el) =>
      scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.45)
    )
  await expect
    .poll(async () => Number(await poster.getAttribute("data-poster-opening")))
    .toBeCloseTo(folded, 1)
  expect(await page.evaluate(() => history.length)).toBe(length)
  const podcast = page.locator("#home-podcast")
  await podcast.evaluate((el) =>
    scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.5)
  )
  await expect(podcast).toHaveAttribute("data-podcast-scene-ready", "true")
  await expect(podcast).toHaveAttribute("data-podcast-reveal", "0.500")
})

test("media controls switch the real player from sample to NASA podcast", async ({
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
  await page.goto("/")
  const audio = page.locator("#home-audio")
  await audio.getByRole("button", { name: "شنیدن نمونهٔ رایگان" }).click()
  const player = page.getByRole("region", { name: "پخش‌کننده" })
  await expect(player).toBeVisible()
  await page
    .locator("#home-podcast")
    .getByRole("button", { name: "شنیدن پادکست" })
    .click()
  await expect(player).toContainText("Encore: A Year In Mars Dune Alpha")
  await expect
    .poll(() =>
      page.evaluate(() => document.querySelector("audio")?.currentTime ?? 0)
    )
    .toBeGreaterThan(0)
})

test("flat poster fallback and phone layout survive unavailable WebGL", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 851 })
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = new Proxy(
      HTMLCanvasElement.prototype.getContext,
      {
        apply(target, receiver, args) {
          if (String(args[0]).includes("webgl")) return null
          return Reflect.apply(target, receiver, args)
        },
      }
    )
  })
  await page.goto("/")
  await page.locator("#home-audio").scrollIntoViewIfNeeded()
  await expect(page.locator("[data-home-poster-fallback]")).toHaveCSS(
    "opacity",
    "1"
  )
  await expect(page.locator("[data-home-poster-fallback]")).toHaveAttribute(
    "src",
    "/home-media/nasa-rocket-provided.webp"
  )
  await expect(
    page
      .locator("#home-audio")
      .getByRole("button", { name: "شنیدن نمونهٔ رایگان" })
  ).toBeVisible()
  await page.locator("#home-podcast").scrollIntoViewIfNeeded()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    393
  )
})

test("reduced motion preserves flat poster and active media destinations", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.locator("#home-audio").scrollIntoViewIfNeeded()
  await expect(page.locator("[data-home-poster-fallback]")).toHaveCSS(
    "opacity",
    "1"
  )
  await expect(page.locator("[data-press-shelf]")).toHaveAttribute(
    "data-home-phase",
    "audio"
  )
  const rail = page.getByRole("navigation", { name: "فهرست قفسه" })
  await expect(
    rail.getByRole("link", { name: "رفتن به صحنهٔ کتاب صوتی" })
  ).toHaveAttribute("aria-current", "step")
  await page.locator("#home-podcast").scrollIntoViewIfNeeded()
  await expect(
    rail.getByRole("link", { name: "رفتن به صحنهٔ پادکست" })
  ).toHaveAttribute("aria-current", "step")
})
