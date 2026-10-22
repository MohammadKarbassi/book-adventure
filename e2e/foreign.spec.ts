import { STORAGE_PREFIX, clearStore, expect, test } from "./fixtures"

// Works against the real API (dev server) and the recorded fixtures
// (production webServer): no titles are hard-coded, the first card is used.

const SUBJECTS = [
  "فانتزی",
  "علمی‌تخیلی",
  "معمایی و جنایی",
  "کلاسیک‌ها",
  "تاریخ",
  "فلسفه",
]

// Live Open Library requests can be slow on a cold cache.
test.setTimeout(120_000)

test.describe("foreign books", () => {
  test("lists six subject shelves with books", async ({ page }) => {
    await page.goto("/foreign", { timeout: 90_000 })
    await expect(
      page.getByRole("heading", { level: 1, name: "کتاب‌های خارجی" })
    ).toBeVisible()
    await expect(page).toHaveTitle(/کتاب‌های خارجی/)

    for (const name of SUBJECTS) {
      await expect(
        page.getByRole("heading", { level: 2, name, exact: true })
      ).toBeAttached()
    }
    const fantasy = page.getByRole("region", { name: "فانتزی", exact: true })
    await expect(
      fantasy.locator('a[href^="/foreign/OL"]').first()
    ).toBeVisible()
    // Every shelf rendered books, or at most shows its retry alert.
    await expect(page.locator('a[href^="/foreign/OL"]')).not.toHaveCount(0)
  })

  test("buy and favorite a book, then find it in the library", async ({
    page,
  }) => {
    await page.goto("/foreign", { timeout: 90_000 })
    await clearStore(page)

    const card = page.locator('a[href^="/foreign/OL"]').first()
    const href = await card.getAttribute("href")
    expect(href).toMatch(/^\/foreign\/OL\d+W$/)
    const title = (await card.getByRole("heading").textContent())?.trim()
    expect(title).toBeTruthy()

    await card.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    const heading = page.getByRole("heading", { level: 1 })
    await expect(heading).toHaveText(title!)
    await expect(page).toHaveTitle(new RegExp(escapeRegExp(title!)))
    await expect(page.getByText(/[۰-۹٬]+ تومان/).first()).toBeVisible()
    await expect(
      page.getByRole("navigation", { name: "breadcrumb" }).getByRole("link", {
        name: "کتاب‌های خارجی",
      })
    ).toHaveAttribute("href", "/foreign")

    // Purchase through the shared dialog.
    await page.getByRole("button", { name: "خرید کتاب" }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("button", { name: "پرداخت و خرید" }).click()
    await expect(
      dialog.getByRole("heading", { name: "کتاب خریداری شد" })
    ).toBeVisible()
    await expect(
      dialog.getByRole("link", { name: /خواندن در Open Library/ })
    ).toHaveAttribute("target", "_blank")
    await dialog.getByRole("button", { name: "بستن" }).first().click()
    await expect(dialog).toBeHidden()
    await expect(
      page.getByText("در کتابخانهٔ شما", { exact: true })
    ).toBeVisible()
    const olLink = page.getByRole("link", { name: /مشاهده در Open Library/ })
    await expect(olLink).toHaveAttribute(
      "href",
      `https://openlibrary.org/works/${href!.split("/").pop()}`
    )
    await expect(olLink).toHaveAttribute("rel", /noopener/)

    // Favorite.
    const favorite = page.getByRole("button", {
      name: "افزودن به علاقه‌مندی‌ها",
    })
    await favorite.click()
    await expect(favorite).toHaveAttribute("aria-pressed", "true")

    const stored = await page.evaluate(
      (prefix) => window.localStorage.getItem(`${prefix}foreignBooks`),
      STORAGE_PREFIX
    )
    expect(stored).toContain(title!)

    // Both library tabs show it, linking back to the foreign page.
    await page.goto("/library")
    await expect(
      page.getByRole("tab", { name: "خریده‌شده‌ها (۱)" })
    ).toBeVisible()
    const purchased = page.getByRole("list", { name: "کتاب‌های خریده‌شده" })
    await expect(purchased.getByRole("listitem")).toHaveCount(1)
    await expect(purchased.locator(`a[href="${href}"]`)).toContainText(title!)

    await page.getByRole("tab", { name: /علاقه‌مندی‌ها/ }).click()
    const favorites = page.getByRole("list", { name: "علاقه‌مندی‌ها" })
    await expect(favorites.getByRole("listitem")).toHaveCount(1)
    await favorites.locator(`a[href="${href}"]`).click()
    await expect(page).toHaveURL(new RegExp(`${href}$`))
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!)
  })

  test("an invalid work id shows the 404 page", async ({ page }) => {
    const response = await page.goto("/foreign/abc")
    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole("heading", { name: "این صفحه پیدا نشد" })
    ).toBeVisible()
  })
})

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
