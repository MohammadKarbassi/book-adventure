import type { Locator, Page } from "@playwright/test"

import { clearStore, expect, STORAGE_PREFIX, test } from "./fixtures"

// سمفونی مردگان: a paid ebook outside the subscription.
const PAID_EBOOK = 1631
const AUDIOBOOK = 153377
const FREE_EBOOK = 64156

const toLatin = (text: string) =>
  text.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))

/** «صفحهٔ ۳ و ۴ از ۱۹» → { first: 3, total: 19 } */
async function readIndicator(indicator: Locator) {
  const text = toLatin((await indicator.textContent()) ?? "")
  const match = text.match(/صفحهٔ (\d+).* از (\d+)/)
  if (!match) throw new Error(`Unexpected indicator: ${text}`)
  return { first: Number(match[1]), total: Number(match[2]) }
}

async function openReader(page: Page, path: string) {
  await page.goto(path, { timeout: 120_000 })
  // Keyboard and stored data are wired up once the reader has hydrated.
  await expect(page.locator("section[data-ready]")).toBeVisible({
    timeout: 60_000,
  })
  return page.locator("p[aria-live=polite]")
}

test.beforeEach(async ({ page }) => {
  await page.goto("/", { timeout: 120_000 })
  await clearStore(page)
})

test("turns pages with the keyboard and buttons and remembers the place", async ({
  page,
}) => {
  const indicator = await openReader(page, `/read/${PAID_EBOOK}`)
  await expect(indicator).toHaveText(/^صفحهٔ ۱/)
  await expect(page).toHaveTitle(/خواندن سمفونی مردگان/)

  await page.keyboard.press("ArrowLeft")
  await expect
    .poll(async () => (await readIndicator(indicator)).first)
    .toBeGreaterThan(1)
  const afterKey = (await readIndicator(indicator)).first

  await page.getByRole("button", { name: "صفحهٔ بعد" }).click()
  await expect
    .poll(async () => (await readIndicator(indicator)).first)
    .toBeGreaterThan(afterKey)
  const saved = await indicator.textContent()

  await page.reload()
  await expect(page.locator("section[data-ready]")).toBeVisible()
  await expect(indicator).toHaveText(saved!)

  const restored = (await readIndicator(indicator)).first
  await page.getByRole("button", { name: "صفحهٔ قبل" }).click()
  await expect
    .poll(async () => (await readIndicator(indicator)).first)
    .toBeLessThan(restored)
})

test("ends the sample with a purchase call to action", async ({ page }) => {
  const indicator = await openReader(page, `/read/${PAID_EBOOK}`)
  await expect(page.getByText("نمونه", { exact: true })).toBeVisible()

  const { total } = await readIndicator(indicator)
  await page.keyboard.press("End")
  await expect
    .poll(async () => (await readIndicator(indicator)).first)
    .toBe(total)
  await expect(
    page.getByText("برای خواندن ادامهٔ کتاب، آن را بخرید یا اشتراک بگیرید")
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "خرید کتاب" })).toHaveAttribute(
    "href",
    `/book/${PAID_EBOOK}`
  )
  await expect(
    page.getByRole("link", { name: "اشتراک بگیرید" })
  ).toHaveAttribute("href", "/subscription")
  await expect(page.getByRole("button", { name: "صفحهٔ بعد" })).toBeDisabled()
})

test("a purchase unlocks the rest of the book", async ({ page }) => {
  const indicator = await openReader(page, `/read/${PAID_EBOOK}`)
  const sampleTotal = (await readIndicator(indicator)).total

  await page.evaluate(
    ({ key, bookId }) =>
      localStorage.setItem(
        key,
        JSON.stringify([{ bookId, purchasedAt: new Date().toISOString() }])
      ),
    { key: `${STORAGE_PREFIX}purchases`, bookId: PAID_EBOOK }
  )
  await page.reload()
  await expect(page.locator("section[data-ready]")).toBeVisible()
  await expect
    .poll(async () => (await readIndicator(indicator)).total)
    .toBeGreaterThan(sampleTotal)
  await expect(page.getByText("نمونه", { exact: true })).toHaveCount(0)
})

test("audiobooks have no reader", async ({ page }) => {
  await page.goto(`/read/${AUDIOBOOK}`, { timeout: 120_000 })
  await expect(
    page.getByRole("heading", { name: "این کتاب صوتی است" })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "رفتن به صفحهٔ کتاب" })
  ).toHaveAttribute("href", `/book/${AUDIOBOOK}`)
})

test("?sample=1 shows the sample badge even for a free book", async ({
  page,
}) => {
  await openReader(page, `/read/${FREE_EBOOK}`)
  await expect(page.getByText("نمونه", { exact: true })).toHaveCount(0)

  await openReader(page, `/read/${FREE_EBOOK}?sample=1`)
  await expect(page.getByText("نمونه", { exact: true })).toBeVisible()
})

test("unknown books are not found", async ({ page }) => {
  const response = await page.goto("/read/999999999", { timeout: 120_000 })
  expect(response?.status()).toBe(404)
})
