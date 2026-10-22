import { expect, test, STORAGE_PREFIX } from "./fixtures"

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1790, height: 650 },
  { width: 1440, height: 650 },
]) {
  test(`first pulled cover clears personalized title at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(
      (key) => localStorage.setItem(key, "[4339]"),
      `${STORAGE_PREFIX}favorites`
    )
    await page.goto("/")
    await expect(page.getByText("بر اساس علاقه‌مندی‌های شما")).toBeVisible()
    await page
      .locator("#adventure-shelf")
      .evaluate((el) =>
        scrollTo(0, el.getBoundingClientRect().top + scrollY - 180)
      )
    const first = page.locator('[data-shelf-index="0"]')
    await page.evaluate(() => document.fonts.ready)
    await expect(first).toHaveCSS("transform", "none")
    const rect = (await first.boundingBox())!
    expect(rect.y).toBeLessThan(viewport.height)
    // Native mouse movement avoids locator.hover scrolling the heading away.
    await page.mouse.move(
      rect.x + 30,
      Math.min(rect.y + rect.height / 2, viewport.height - 1)
    )
    await expect(page.locator("[data-shelf-canvas]")).toHaveAttribute(
      "data-foreground",
      "0"
    )
    await expect
      .poll(async () =>
        first.evaluate(
          (el) =>
            new DOMMatrixReadOnly(
              getComputedStyle(el.querySelector("[data-shelf-body]")!).transform
            ).m43
        )
      )
      .toBeGreaterThan(41)
    const clearance = await first.evaluate((el) => {
      const body = el.querySelector<HTMLElement>("[data-shelf-body]")!
      const matrix = new DOMMatrixReadOnly(getComputedStyle(body).transform)
      const angle = -Math.atan2(matrix.m23, matrix.m22)
      const bounds = el.getBoundingClientRect()
      const eye = innerHeight / (2 * Math.tan(Math.PI / 8))
      const centerY =
        innerHeight / 2 - bounds.top - body.offsetHeight / 2 - matrix.m42
      // Project both ends of the actual Three cover slab (+Y face).
      const top = Math.min(
        ...[0, -body.offsetWidth * 0.666].map((z) => {
          const y = body.offsetHeight * 0.5
          const worldY = centerY + y * Math.cos(angle) - z * Math.sin(angle)
          const worldZ = matrix.m43 + y * Math.sin(angle) + z * Math.cos(angle)
          return innerHeight / 2 - (worldY * eye) / (eye - worldZ)
        })
      )
      return (
        top -
        document
          .querySelector("#shelf-heading")!
          .closest("header")!
          .getBoundingClientRect().bottom
      )
    })
    expect(clearance).toBeGreaterThanOrEqual(16)
  })
}
