import { STORAGE_PREFIX, expect, test } from "./fixtures"

test.describe("home page", () => {
  test("header search remains usable while exploring the shelf", async ({
    page,
  }) => {
    await page.goto("/")
    await page
      .getByRole("button", { name: "جستجو", exact: true })
      .first()
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })
  test.beforeEach(async ({ page }) => {
    // The first dev-server compile of "/" can be slow.
    await page.goto("/", { timeout: 120_000 })
  })

  const shelf = (page: import("@playwright/test").Page) =>
    page.getByRole("list", { name: "قفسهٔ منتخب" })

  test("the journey title leads the shelf with a readable aligned display heading", async ({
    page,
  }) => {
    const heading = page.locator("#shelf-heading")
    await heading.scrollIntoViewIfNeeded()
    const title = await heading.boundingBox()
    const stack = await shelf(page).boundingBox()
    expect(
      Math.abs(title!.x + title!.width - stack!.x - stack!.width)
    ).toBeLessThan(3)
    expect(
      await heading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    ).toBeGreaterThanOrEqual(56)
    const description = page.getByText("کتاب‌های انتخاب شده برای سفرتان", {
      exact: true,
    })
    expect((await description.boundingBox())!.y).toBeGreaterThan(
      title!.y + title!.height
    )
  })

  test("the shelf shows the numbered adventures", async ({ page }) => {
    const links = shelf(page).getByRole("link")
    expect(await links.count()).toBeGreaterThanOrEqual(10)
    await expect(links.first()).toHaveAccessibleName(
      /^ماجراجویی ۱: .+ — .+ اثر /
    )
    await expect(links.nth(1)).toHaveAccessibleName(/^ماجراجویی ۲: /)
    await expect(
      page.getByRole("heading", { level: 2, name: "سفر ماجراجویی شما" })
    ).toBeVisible()
    await expect(
      page.getByText("کتاب‌های انتخاب شده برای سفرتان")
    ).toBeVisible()
    // A fresh store: default order, no personalization note.
    await expect(page.getByText("بر اساس علاقه‌مندی‌های شما")).toHaveCount(0)
  })

  test("the desktop shelf has a centered physical-book scale", async ({
    page,
  }) => {
    const viewport = page.viewportSize()!
    await page.getByRole("link", { name: "سفرتان را انتخاب کنید" }).click()
    const first = (await shelf(page)
      .getByRole("listitem")
      .first()
      .boundingBox())!
    expect(first.width / viewport.width).toBeGreaterThan(0.45)
    expect(first.width / viewport.width).toBeLessThan(0.54)
    expect(
      Math.abs(first.x + first.width / 2 - viewport.width / 2)
    ).toBeLessThan(30)
    // The larger native-flow display title now leads the stack.
    expect(first.y / viewport.height).toBeGreaterThan(0.4)
    expect(first.y / viewport.height).toBeLessThan(0.56)
  })

  test("hovering a shelf book shows its price chip", async ({ page }) => {
    const book = shelf(page).getByRole("link").nth(2)
    const chip = book.getByText("شروع ماجراجویی")
    await expect(chip).toBeHidden()
    await book.hover()
    await expect(chip).toBeVisible()
    await expect(book.getByText(/تومان|رایگان/)).toBeVisible()
  })

  test("the shelf renders lit book materials without losing its DOM links", async ({
    page,
  }) => {
    await expect(page.locator("[data-shelf-canvas]")).toHaveAttribute(
      "data-ready",
      "true"
    )
    await expect(shelf(page).getByRole("link").first()).toBeVisible()
    await expect(shelf(page).locator("[data-shelf-body]").first()).toHaveCSS(
      "opacity",
      "0"
    )
  })

  test("clicking a shelf book opens its adventure", async ({ page }) => {
    const book = shelf(page).getByRole("link").nth(2)
    const href = await book.getAttribute("href")
    expect(href).toMatch(/^\/adventures\/\d+$/)
    const name = (await book.getAttribute("aria-label"))!
      .split(" — ")[0]
      .replace(/^ماجراجویی ۳: /, "")
    await book.click()
    await expect(page).toHaveURL(new RegExp(`${href}$`), { timeout: 60_000 })
    await expect(
      page.getByRole("heading", { level: 2, name, exact: true })
    ).toBeInViewport()
  })

  test("hovering any book tips it forward to show its cover", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "سفرتان را انتخاب کنید" }).click()
    // Place the first spine above eye level independently of title height:
    // its scroll tilt shows the underside until hovered.
    const book = shelf(page).getByRole("link").first()
    await book.evaluate((el) =>
      scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.25)
    )
    const tilt = () =>
      book
        .locator("span[aria-hidden]")
        .first()
        .evaluate(
          (element) => new DOMMatrix(getComputedStyle(element).transform).m23
        )
    // m23 = sin(rotateX): negative when the cover (top face) shows.
    await expect.poll(tilt).toBeGreaterThan(0)
    await book.hover()
    await expect.poll(tilt).toBeLessThan(-0.3)
    await page.mouse.move(5, 5)
    await expect.poll(tilt).toBeGreaterThan(0)
  })

  test("pulled books use the foreground pass for mouse and keyboard, then return", async ({
    page,
  }) => {
    const book = shelf(page).getByRole("link").nth(3)
    const canvas = page.locator("[data-shelf-canvas]")
    await book.hover()
    await expect(canvas).toHaveAttribute("data-foreground", "3")
    await page.mouse.move(5, 5)
    await expect(canvas).toHaveAttribute("data-foreground", "")
    await book.focus()
    await expect(canvas).toHaveAttribute("data-foreground", "3")
    await book.blur()
    await expect(canvas).toHaveAttribute("data-foreground", "")
  })

  test("a rail tick brings its book into view", async ({ page }) => {
    const books = shelf(page).getByRole("listitem")
    const lastIndex = (await books.count()) - 1
    const last = books.nth(lastIndex)
    const label = (await last.getByRole("link").getAttribute("aria-label"))!
    const [, number, name] = /^ماجراجویی (\S+): (.+?) — /.exec(label)!
    await expect(last).not.toBeInViewport()

    const rail = page.getByRole("navigation", { name: "فهرست قفسه" })
    const tick = rail.getByRole("button", {
      name: `ماجراجویی ${number} · ${name}`,
      exact: true,
    })
    await tick.click()
    await expect(last).toBeInViewport()
    await expect(tick).toHaveAttribute("aria-current", "true")
  })

  test("the scroll cue jumps to the store", async ({ page }) => {
    await page.getByRole("link", { name: "سفرتان را انتخاب کنید" }).click()
    await page.getByRole("link", { name: "به فروشگاه بروید" }).click()
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
      page
        .getByRole("region", { name: "پادکست‌ها" })
        .getByRole("listitem")
        .getByRole("link")
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

test.describe("home page, personalized", () => {
  test("a favorite moves its category's adventures to the top", async ({
    page,
  }) => {
    await page.goto("/", { timeout: 120_000 })
    const links = page
      .getByRole("list", { name: "قفسهٔ منتخب" })
      .getByRole("link")
    // The last adventure's own book as a favorite: its category goes first.
    const last = links.last()
    const href = (await last.getAttribute("href"))!
    const bookId = Number(href.split("/").pop())
    await page.evaluate(
      ({ key, id }) => localStorage.setItem(key, JSON.stringify([id])),
      { key: `${STORAGE_PREFIX}favorites`, id: bookId }
    )
    await page.reload()
    await expect(page.getByText("بر اساس علاقه‌مندی‌های شما")).toBeVisible({
      timeout: 15_000,
    })
    // Its category now leads, so the book moved up from the last place
    // and the numbers follow the new order.
    const hrefs = await links.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href"))
    )
    expect(hrefs.indexOf(href)).toBeLessThan(hrefs.length - 1)
    await expect(links.first()).toHaveAccessibleName(/^ماجراجویی ۱: /)
    await page.evaluate(
      (key) => localStorage.removeItem(key),
      `${STORAGE_PREFIX}favorites`
    )
  })
})
