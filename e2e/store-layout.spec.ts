import { expect, test } from "./fixtures"

const paths = [
  "/categories",
  "/category/story-persian",
  "/search?q=کتاب",
  "/search?q=zzzznomatch",
  "/audiobooks",
  "/book/4339",
  "/foreign",
  "/foreign/OL8400950W",
  "/subscription",
  "/library",
  "/podcasts",
  "/podcasts/1564548541",
  "/read/4339?sample=1",
  "/not-a-page",
]

for (const width of [320, 768, 1024]) {
  test(`shopping, reading and listening routes fit at ${width}px in both themes`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width, height: 900 })
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" })
      for (const path of paths) {
        await page.goto(path)
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        await expect(page.locator("html")).toHaveClass(new RegExp(colorScheme))
        await expect
          .poll(
            () =>
              page.evaluate(
                () => document.documentElement.scrollWidth - innerWidth
              ),
            { message: `${path} in ${colorScheme} at ${width}px` }
          )
          .toBeLessThanOrEqual(1)
      }
    }
    expect(errors).toEqual([])
  })
}
