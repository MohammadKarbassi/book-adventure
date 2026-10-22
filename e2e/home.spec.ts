import { expect, test } from "./fixtures"

test.describe("home page", () => {
  test.beforeEach(async ({ page }) => {
    // The first dev-server compile of "/" can be slow.
    await page.goto("/", { timeout: 120_000 })
  })

  const shelf = (page: import("@playwright/test").Page) =>
    page.getByRole("list", { name: "قفسهٔ منتخب" })

  test("the shelf shows at least 15 linked books", async ({ page }) => {
    const links = shelf(page).getByRole("link")
    expect(await links.count()).toBeGreaterThanOrEqual(15)
    await expect(links.first()).toHaveAccessibleName(/ اثر /)
    await expect(
      page.getByRole("heading", { level: 1, name: "ماجراجویی با کتاب" })
    ).toBeVisible()
  })

  test("hovering a shelf book shows its price chip", async ({ page }) => {
    const book = shelf(page).getByRole("link").nth(2)
    const chip = book.getByText("مشاهده")
    await expect(chip).toBeHidden()
    await book.hover()
    await expect(chip).toBeVisible()
    await expect(book.getByText(/تومان|رایگان/)).toBeVisible()
  })

  test("clicking a shelf book opens its page", async ({ page }) => {
    const book = shelf(page).getByRole("link").first()
    const href = await book.getAttribute("href")
    expect(href).toMatch(/^\/book\/\d+$/)
    await book.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: 60_000 })
  })

  test("a rail tick brings its book into view", async ({ page }) => {
    const books = shelf(page).getByRole("listitem")
    const lastIndex = (await books.count()) - 1
    const last = books.nth(lastIndex)
    const title = (await last
      .getByRole("link")
      .getAttribute("aria-label"))!.split(" اثر ")[0]
    await expect(last).not.toBeInViewport()

    const rail = page.getByRole("navigation", { name: "فهرست قفسه" })
    const tick = rail.getByRole("button", { name: title, exact: true })
    await tick.click()
    await expect(last).toBeInViewport()
    await expect(tick).toHaveAttribute("aria-current", "true")
  })

  test("the scroll cue jumps to the store", async ({ page }) => {
    // Base UI renders the anchor with role="button".
    await page.getByRole("button", { name: "به فروشگاه بروید" }).click()
    await expect(
      page.getByRole("heading", { name: "دسته‌بندی‌ها" })
    ).toBeInViewport()
  })

  test("store sections are present", async ({ page }) => {
    for (const name of [
      "دسته‌بندی‌ها",
      "پرفروش‌های ماه",
      "تازه‌ها",
      "تخفیف‌های ویژه",
      "کتاب‌های صوتی پرفروش",
      "با اشتراک بخوانید",
      "با اشتراک، بی‌حساب بخوانید",
      "پادکست‌ها",
    ]) {
      const heading = page.getByRole("heading", { name, exact: true })
      await heading.scrollIntoViewIfNeeded()
      await expect(heading).toBeVisible()
    }
    const main = page.getByRole("main")
    await expect(
      main.locator("a", { hasText: "مشاهدهٔ طرح‌های اشتراک" })
    ).toHaveAttribute("href", "/subscription")
    await expect(
      main.locator("a", { hasText: "همهٔ پادکست‌ها" })
    ).toHaveAttribute("href", "/podcasts")
    await expect(
      page.getByRole("region", { name: "پادکست‌ها" }).getByRole("link")
    ).toHaveCount(5)
  })

  test("category cards link to their category", async ({ page }) => {
    const categories = page.getByRole("region", { name: "دسته‌بندی‌ها" })
    const links = categories.getByRole("link")
    await expect(links).toHaveCount(8)
    await expect(
      categories.getByRole("link", { name: /روانشناسی/ })
    ).toHaveAttribute("href", "/category/psychology")
  })
})
