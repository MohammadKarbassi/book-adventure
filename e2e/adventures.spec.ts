import { STORAGE_PREFIX, clearStore, expect, test } from "./fixtures"
import type { Page } from "@playwright/test"

const toPersian = (value: number) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[+digit])

/** Adventure book ids in their default order, read from the home shelf. */
async function adventureIds(page: Page): Promise<number[]> {
  await page.goto("/", { timeout: 120_000 })
  await clearStore(page)
  const hrefs = await page
    .getByRole("list", { name: "قفسهٔ منتخب" })
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")))
  return hrefs.map((href) => Number(href!.split("/").pop()))
}

const section = (page: Page, id: number) => page.locator(`#adventure-${id}`)
const eyebrow = (page: Page, number: number, total: number) =>
  page
    .locator("[data-adventure-section]")
    .getByText(`ماجراجویی ${toPersian(number)} از ${toPersian(total)}`, {
      exact: true,
    })
const rail = (page: Page) =>
  page.getByRole("navigation", { name: "مسیر ماجراجویی", exact: true })

test.describe("adventure journey", () => {
  let ids: number[] = []

  test.beforeEach(async ({ page }) => {
    ids = await adventureIds(page)
    expect(ids.length).toBeGreaterThanOrEqual(7)
  })

  test("the first adventure opens with its number, name and rail", async ({
    page,
  }) => {
    await page.goto(`/adventures/${ids[0]}`, { timeout: 120_000 })
    await expect(eyebrow(page, 1, ids.length)).toBeInViewport()
    await expect(
      section(page, ids[0]).getByRole("heading", { level: 2 })
    ).toBeInViewport()
    await expect(rail(page).getByRole("button")).toHaveCount(ids.length)
    await expect(rail(page).getByRole("button").first()).toHaveAttribute(
      "aria-current",
      "step"
    )
    // Fresh store: default order, no personalization note.
    await expect(page.getByText("بر اساس علاقه‌مندی‌های شما")).toHaveCount(0)
  })

  test("a rail tick scrolls to its adventure and updates the URL", async ({
    page,
  }) => {
    await page.goto(`/adventures/${ids[0]}`, { timeout: 120_000 })
    const tick = rail(page).getByRole("button").nth(4)
    await expect(tick).toHaveAccessibleName(/^ماجراجویی ۵ · /)
    await tick.click()
    await expect(eyebrow(page, 5, ids.length)).toBeInViewport()
    await expect(page).toHaveURL(new RegExp(`/adventures/${ids[4]}$`))
    await expect(tick).toHaveAttribute("aria-current", "step")
  })

  test("a deep link shows its adventure", async ({ page }) => {
    await page.goto(`/adventures/${ids[6]}`, { timeout: 120_000 })
    await expect(eyebrow(page, 7, ids.length)).toBeInViewport()
    await expect(page).toHaveURL(new RegExp(`/adventures/${ids[6]}$`))
  })

  test("«ماجراجویی بعدی» moves on to the next adventure", async ({ page }) => {
    await page.goto(`/adventures/${ids[0]}`, { timeout: 120_000 })
    await section(page, ids[0])
      .getByRole("button", { name: /^ماجراجویی بعدی: / })
      .click()
    await expect(eyebrow(page, 2, ids.length)).toBeInViewport()
    await expect(page).toHaveURL(new RegExp(`/adventures/${ids[1]}$`))
  })

  test("the purchase table links to the book page", async ({ page }) => {
    await page.goto(`/adventures/${ids[0]}`, { timeout: 120_000 })
    const table = section(page, ids[0]).getByRole("list", {
      name: "خرید و دسترسی",
    })
    await expect(
      table.getByRole("link", { name: /مشاهدهٔ کتاب و خرید/ })
    ).toHaveAttribute("href", `/book/${ids[0]}`)
  })

  test("the back arrow returns to the shelf", async ({ page }) => {
    await page.goto(`/adventures/${ids[2]}`, { timeout: 120_000 })
    await rail(page).getByRole("link", { name: "بازگشت به قفسه" }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(
      page.getByRole("heading", { level: 1, name: "سفر ماجراجویی شما" })
    ).toBeVisible()
  })

  test("the book can be dragged round and springs back", async ({ page }) => {
    await page.goto(`/adventures/${ids[0]}`, { timeout: 120_000 })
    const stage = section(page, ids[0]).locator("[data-book-stage]")
    await expect(stage).toHaveAccessibleName("کتاب سه‌بعدی؛ برای چرخاندن بکشید")
    const turn = () =>
      stage
        .locator("[data-book-body]")
        .evaluate((element) =>
          Number(
            /rotateY\((-?[\d.]+)deg\)/.exec(element.style.transform)?.[1] ?? 0
          )
        )
    // Let the arrival turn (spine, negative → three-quarter view, positive)
    // happen and settle.
    await expect.poll(turn, { timeout: 15_000 }).toBeGreaterThan(5)
    let rest = await turn()
    await expect
      .poll(
        async () => {
          const previous = rest
          rest = await turn()
          return Math.abs(rest - previous)
        },
        { intervals: [400] }
      )
      .toBeLessThan(0.5)

    const box = (await stage.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (let step = 1; step <= 10; step++) {
      await page.mouse.move(x - step * 20, y)
    }
    // 200px at 0.5°/px: the spine faces the reader.
    expect(Math.abs((await turn()) - rest)).toBeGreaterThan(80)
    await expect(
      page.getByText("برای چرخاندن، کتاب را بکشید").first()
    ).toHaveCSS("opacity", "0")
    await page.mouse.up()
    await expect
      .poll(async () => Math.abs((await turn()) - rest), { timeout: 8_000 })
      .toBeLessThan(1.5)

    // Arrow keys turn it too.
    await stage.focus()
    await page.keyboard.press("ArrowRight")
    await expect
      .poll(async () => Math.abs((await turn()) - rest))
      .toBeGreaterThan(15)
  })

  test("the page is immersive: no site header or footer", async ({ page }) => {
    await page.goto(`/adventures/${ids[0]}`, { timeout: 120_000 })
    await expect(
      page.locator("body > * header, body header").first()
    ).toBeHidden()
    await expect(page.getByRole("contentinfo")).toBeHidden()
    await expect(
      page.getByRole("link", { name: "ماجراجویی با کتاب — صفحهٔ اصلی" }).first()
    ).toBeVisible()
    await page
      .getByRole("button", { name: "راهنمای مسیر ماجراجویی" })
      .last()
      .click()
    await expect(page.getByText("کتاب را بکشید تا بچرخد")).toBeVisible()
  })

  test("an unknown adventure is a 404", async ({ page }) => {
    const response = await page.goto("/adventures/99", { timeout: 120_000 })
    expect(response?.status()).toBe(404)
    await expect(
      page.getByRole("heading", { name: "این صفحه پیدا نشد" })
    ).toBeVisible()
  })

  test("the order follows the reader's interests", async ({ page }) => {
    const target = ids[ids.length - 1]
    await page.evaluate(
      ({ key, id }) => localStorage.setItem(key, JSON.stringify([id])),
      { key: `${STORAGE_PREFIX}favorites`, id: target }
    )
    await page.goto(`/adventures/${target}`, { timeout: 120_000 })
    // Appears after hydration, once the stored favorite has reordered the journey.
    await expect(page.getByText("بر اساس علاقه‌مندی‌های شما")).toBeAttached({
      timeout: 15_000,
    })
    // Deep link still lands on the favorite's adventure…
    await expect(
      section(page, target).getByRole("heading", { level: 2 })
    ).toBeInViewport()
    // …which now leads with the other adventures of its category.
    const sections = page.locator("[data-adventure-section]")
    const category = await section(page, target).getAttribute("data-category")
    await expect(sections.first()).toHaveAttribute("data-category", category!)
    const order = await sections.evaluateAll((elements) =>
      elements.map((element) => Number(element.id.replace("adventure-", "")))
    )
    expect(order.indexOf(target)).toBeLessThan(ids.length - 1)
    const number = order.indexOf(target) + 1
    await expect(
      section(page, target).getByText(
        `ماجراجویی ${toPersian(number)} از ${toPersian(ids.length)}`
      )
    ).toBeVisible()
    await clearStore(page)
  })
})
