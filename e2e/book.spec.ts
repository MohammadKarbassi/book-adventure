import type { Page } from "@playwright/test"

import { formatPrice } from "../lib/format"
import { clearStore, expect, test } from "./fixtures"

// «سمفونی مردگان»: an ebook that is neither free nor in the subscription.
const EBOOK = { id: 1631, title: "سمفونی مردگان", price: 225000 }
// «کلیدر»: an audiobook.
const AUDIOBOOK_ID = 153377

/** Opens a book page with empty storage and waits for hydration. */
async function openBook(page: Page, id: number) {
  await page.goto(`/book/${id}`, { timeout: 120_000 })
  await clearStore(page)
  await page.reload()
  await waitForHydration(page)
}

// The buy/read button replaces a skeleton once localStorage has been read.
async function waitForHydration(page: Page) {
  await expect(
    page
      .getByRole("button", { name: "خرید کتاب" })
      .or(page.getByRole("link", { name: "خواندن کتاب" }))
      .or(page.getByRole("button", { name: "گوش دادن" }))
  ).toBeVisible({ timeout: 30_000 })
}

test("shows the title and the price", async ({ page }) => {
  await openBook(page, EBOOK.id)
  await expect(page).toHaveTitle(new RegExp(EBOOK.title))
  await expect(
    page.getByRole("heading", { level: 1, name: EBOOK.title })
  ).toBeVisible()
  await expect(page.getByText(formatPrice(EBOOK.price)).first()).toBeVisible()
  await expect(
    page.getByRole("link", { name: "خواندن نمونه" })
  ).toHaveAttribute("href", `/read/${EBOOK.id}?sample=1`)
})

test("buying a book unlocks it and survives a reload", async ({ page }) => {
  await openBook(page, EBOOK.id)

  await page.getByRole("button", { name: "خرید کتاب" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("heading", { name: "خرید کتاب" })).toBeVisible()
  await dialog.getByRole("button", { name: "پرداخت و خرید" }).click()
  await expect(
    dialog.getByRole("heading", { name: "کتاب خریداری شد" })
  ).toBeVisible()
  await expect(
    dialog.getByRole("link", { name: "خواندن کتاب" })
  ).toHaveAttribute("href", `/read/${EBOOK.id}`)
  await dialog.getByRole("button", { name: "بستن" }).first().click()
  await expect(dialog).toBeHidden()

  await page.reload()
  await expect(page.getByRole("link", { name: "خواندن کتاب" })).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByRole("button", { name: "خرید کتاب" })).toHaveCount(0)
})

test("favorite toggles and persists", async ({ page }) => {
  await openBook(page, EBOOK.id)
  const favorite = page.getByRole("button", {
    name: "افزودن به علاقه‌مندی‌ها",
  })
  await expect(favorite).toHaveAttribute("aria-pressed", "false")
  await favorite.click()
  await expect(favorite).toHaveAttribute("aria-pressed", "true")

  await page.reload()
  await waitForHydration(page)
  await expect(favorite).toHaveAttribute("aria-pressed", "true")
  await favorite.click()
  await expect(favorite).toHaveAttribute("aria-pressed", "false")
})

test("review form validates, adds the review and keeps it", async ({
  page,
}) => {
  await openBook(page, EBOOK.id)
  await page.getByRole("tab", { name: /نظرات/ }).click()

  const submit = page.getByRole("button", { name: "ثبت نظر" })
  await submit.click()
  await expect(
    page.getByRole("alert").filter({ hasText: "امتیاز" })
  ).toBeVisible()
  await expect(
    page.getByRole("alert").filter({ hasText: "متن نظر را بنویسید" })
  ).toBeVisible()

  const text = "روایت چندصدایی کتاب تا صفحهٔ آخر رهایم نکرد."
  await page.getByRole("button", { name: /۴ ستاره/ }).click()
  await page.getByLabel("نام (اختیاری)").fill("مریم")
  await page.getByLabel("متن نظر").fill(text)
  await submit.click()

  const review = page.getByRole("listitem").filter({ hasText: text })
  await expect(review).toBeVisible()
  await expect(review.getByText("نظر شما")).toBeVisible()
  await expect(review.getByText("مریم")).toBeVisible()
  await expect(page.getByLabel("متن نظر")).toHaveValue("")

  await page.reload()
  await waitForHydration(page)
  await page.getByRole("tab", { name: /نظرات/ }).click()
  await expect(review).toBeVisible()
  await expect(review.getByText("نظر شما")).toBeVisible()
})

test("an unknown book shows the 404 page", async ({ page }) => {
  const response = await page.goto("/book/99999999", { timeout: 120_000 })
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole("heading", { name: "این صفحه پیدا نشد" })
  ).toBeVisible()
})

test("an audiobook offers a free sample", async ({ page }) => {
  await openBook(page, AUDIOBOOK_ID)
  await expect(
    page.getByRole("button", { name: "شنیدن نمونهٔ رایگان" })
  ).toBeVisible()
  await expect(page.getByText("Internet Archive").first()).toBeVisible()
})
