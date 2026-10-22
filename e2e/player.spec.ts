import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { Page } from "@playwright/test"

import { STORAGE_PREFIX, expect, test } from "./fixtures"

type PodcastData = {
  podcasts: {
    id: string
    title: string
    episodes: { id: string; title: string }[]
  }[]
}

const here = path.dirname(fileURLToPath(import.meta.url))

const data = JSON.parse(
  readFileSync(path.join(here, "../data/podcasts.json"), "utf8")
) as PodcastData
const podcast = data.podcasts[0]
const episode = podcast.episodes[0]
const trackId = `ep-${podcast.id}-${episode.id}`

const SILENCE = path.join(here, "assets/silence.mp3")
const AUDIO_HOSTS =
  /\.mp3(\?|$)|acast\.com|podbean\.com|castbox\.fm|shenoto\.com|archive\.org/

/** Every audio request gets 30 s of local silence instead of the real feed. */
async function stubAudio(page: Page) {
  await page.route(
    (url) => AUDIO_HOSTS.test(url.href),
    (route) => route.fulfill({ path: SILENCE, contentType: "audio/mpeg" })
  )
  await page.route("**/*", (route) =>
    route.request().resourceType() === "media"
      ? route.fulfill({ path: SILENCE, contentType: "audio/mpeg" })
      : route.fallback()
  )
}

const audioTime = (page: Page) =>
  page.evaluate(() => document.querySelector("audio")?.currentTime ?? 0)

const savedPosition = (page: Page) =>
  page.evaluate(
    ({ key, id }) => {
      const raw = window.localStorage.getItem(key)
      return raw ? ((JSON.parse(raw) as Record<string, number>)[id] ?? 0) : 0
    },
    { key: `${STORAGE_PREFIX}audioProgress`, id: trackId }
  )

test.beforeEach(async ({ page }) => {
  await stubAudio(page)
})

test("plays an episode in the mini player across navigation", async ({
  page,
}) => {
  test.slow()
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))

  await page.goto(`/podcasts/${podcast.id}`, { timeout: 120_000 })
  await expect(
    page.getByRole("heading", { level: 1, name: podcast.title })
  ).toBeVisible()

  const player = page.getByRole("region", { name: "پخش‌کننده" })
  await expect(player).toBeHidden()

  const row = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: episode.title }) })
  await row.getByRole("button", { name: "پخش", exact: true }).click()

  await expect(player).toBeVisible()
  await expect(player).toContainText(episode.title)
  await expect(row.getByRole("button", { name: "توقف" })).toHaveAttribute(
    "aria-pressed",
    "true"
  )

  // Pause and resume from the bar.
  const pauseButton = player.getByRole("button", { name: "توقف", exact: true })
  await expect(pauseButton).toBeVisible()
  await pauseButton.click()
  const playButton = player.getByRole("button", { name: "پخش", exact: true })
  await expect(playButton).toBeVisible()
  await playButton.click()
  await expect(pauseButton).toBeVisible()

  // Space toggles playback when focus isn't on a control.
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur())
  await page.keyboard.press("Space")
  await expect(playButton).toBeVisible()
  await page.keyboard.press("Space")
  await expect(pauseButton).toBeVisible()

  // Playback speed.
  await player.getByRole("button", { name: /سرعت پخش/ }).click()
  await page.getByRole("menuitemradio", { name: "۱٫۵×" }).click()
  await expect(player.getByRole("button", { name: /سرعت پخش/ })).toContainText(
    "۱٫۵×"
  )

  // The bar survives a client-side navigation and keeps playing.
  await page
    .getByRole("navigation", { name: "breadcrumb" })
    .getByRole("link", { name: "خانه" })
    .click()
  await expect(page).toHaveURL(/\/$/)
  await expect(player).toBeVisible()
  await expect(pauseButton).toBeVisible()
  await expect
    .poll(() => audioTime(page), { timeout: 15_000 })
    .toBeGreaterThan(3)

  // The position is saved and survives a reload.
  await page.reload()
  await expect.poll(() => savedPosition(page)).toBeGreaterThan(0)
  const saved = await savedPosition(page)
  await expect(player).toBeHidden()

  // Playing it again resumes there, at the saved speed; close hides the bar.
  await page.goto(`/podcasts/${podcast.id}`)
  await row.getByRole("button", { name: "پخش", exact: true }).click()
  await expect(player).toBeVisible()
  await expect
    .poll(() => audioTime(page), { timeout: 15_000 })
    .toBeGreaterThanOrEqual(saved)
  await expect(player.getByRole("button", { name: /سرعت پخش/ })).toContainText(
    "۱٫۵×"
  )
  await player.getByRole("button", { name: "بستن پخش‌کننده" }).click()
  await expect(player).toBeHidden()

  expect(errors).toEqual([])
})

test("lists the ten podcasts", async ({ page }) => {
  await page.goto("/podcasts", { timeout: 120_000 })
  await expect(
    page.getByRole("heading", { level: 1, name: "پادکست‌ها" })
  ).toBeVisible()
  const shows = page
    .getByRole("region", { name: "همهٔ پادکست‌ها" })
    .getByRole("listitem")
  await expect(shows).toHaveCount(10)
  await expect(
    shows.first().getByRole("link", { name: new RegExp(podcast.title) })
  ).toHaveAttribute("href", `/podcasts/${podcast.id}`)

  // Only the first artworks load eagerly; the rest wait until scrolled to.
  const loading = await shows
    .locator("img")
    .evaluateAll((images) =>
      images.map((image) => image.getAttribute("loading"))
    )
  expect(loading).toEqual([
    "eager",
    "eager",
    ...Array.from({ length: 8 }, () => "lazy"),
  ])

  const latest = page
    .getByRole("region", { name: "تازه‌ترین قسمت‌ها" })
    .getByRole("listitem")
  await expect(latest).toHaveCount(8)
})
