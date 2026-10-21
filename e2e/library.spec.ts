import { readFileSync } from "node:fs"

import { STORAGE_PREFIX, clearStore, expect, test } from "./fixtures"

type CatalogBook = {
  id: number
  title: string
  type: "ebook" | "audiobook"
  inPlus: boolean
}

const catalog = JSON.parse(
  readFileSync(new URL("../data/catalog.json", import.meta.url), "utf8")
) as { books: CatalogBook[] }

// Titles on the site use Persian digits.
const persian = (text: string) =>
  text.replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const ebook = catalog.books.find((book) => book.type === "ebook")!
const audiobook = catalog.books.find((book) => book.type === "audiobook")!
const favorite = catalog.books.find(
  (book) => book.id !== ebook.id && book.id !== audiobook.id
)!

test.describe("library page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library", { timeout: 120_000 })
    await clearStore(page)
  })

  test("shows empty states on a fresh store", async ({ page }) => {
    await page.reload()
    await expect(page).toHaveTitle(/کتابخانهٔ من/)
    await expect(page.getByText("هنوز کتابی نخریده‌اید")).toBeVisible()
    await expect(
      page.getByRole("tab", { name: "خریده‌شده‌ها (۰)" })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "اشتراک ندارید؟ مشاهدهٔ طرح‌ها" })
    ).toBeVisible()

    await page.getByRole("tab", { name: /علاقه‌مندی‌ها/ }).click()
    await expect(page.getByText("فهرست علاقه‌مندی‌ها خالی است")).toBeVisible()

    await page.getByRole("tab", { name: /با اشتراک/ }).click()
    await expect(page.getByText("اشتراک فعالی ندارید")).toBeVisible()
    await expect(
      page.getByRole("link", { name: "مشاهدهٔ طرح‌های اشتراک" })
    ).toHaveAttribute("href", "/subscription")
  })

  test("lists seeded purchases and favorites; remove and restore a favorite", async ({
    page,
  }) => {
    await page.evaluate(
      ({ prefix, purchases, favorites }) => {
        window.localStorage.setItem(
          `${prefix}purchases`,
          JSON.stringify(purchases)
        )
        window.localStorage.setItem(
          `${prefix}favorites`,
          JSON.stringify(favorites)
        )
      },
      {
        prefix: STORAGE_PREFIX,
        purchases: [
          { bookId: ebook.id, purchasedAt: "2026-10-20T10:00:00.000Z" },
          { bookId: audiobook.id, purchasedAt: "2026-10-18T10:00:00.000Z" },
        ],
        favorites: [favorite.id],
      }
    )
    await page.reload()

    await expect(
      page.getByRole("tab", { name: "خریده‌شده‌ها (۲)" })
    ).toBeVisible()
    await expect(
      page.getByRole("tab", { name: "علاقه‌مندی‌ها (۱)" })
    ).toBeVisible()

    const purchased = page.getByRole("list", { name: "کتاب‌های خریده‌شده" })
    await expect(purchased.getByRole("listitem")).toHaveCount(2)
    await expect(purchased.getByText(/خریداری‌شده در/).first()).toBeVisible()
    await expect(
      purchased.getByRole("link", { name: `خواندن ${persian(ebook.title)}` })
    ).toHaveAttribute("href", `/read/${ebook.id}`)
    await expect(
      purchased.getByRole("link", {
        name: `گوش دادن ${persian(audiobook.title)}`,
      })
    ).toHaveAttribute("href", `/book/${audiobook.id}`)

    await page.getByRole("tab", { name: /علاقه‌مندی‌ها/ }).click()
    await expect(page).toHaveURL(/#favorites$/)
    const favorites = page.getByRole("list", { name: "علاقه‌مندی‌ها" })
    await expect(favorites.getByRole("listitem")).toHaveCount(1)

    await favorites
      .getByRole("button", { name: /از علاقه‌مندی‌ها/ })
      .first()
      .click()
    await expect(page.getByText("فهرست علاقه‌مندی‌ها خالی است")).toBeVisible()
    await expect(
      page.getByRole("tab", { name: "علاقه‌مندی‌ها (۰)" })
    ).toBeVisible()

    await page.getByRole("button", { name: "بازگرداندن" }).click()
    await expect(favorites.getByRole("listitem")).toHaveCount(1)
    await expect(
      favorites.getByRole("link", {
        name: new RegExp(escapeRegExp(persian(favorite.title))),
      })
    ).toBeVisible()

    // The selected tab survives a reload.
    await page.reload()
    await expect(
      page.getByRole("tab", { name: "علاقه‌مندی‌ها (۱)" })
    ).toHaveAttribute("aria-selected", "true")
  })
})
