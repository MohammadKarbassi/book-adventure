import { expect, test } from "./fixtures"

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 393, height: 851 },
]) {
  test(`native store surface covers stale WebGL clipping at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({
      colorScheme: "light",
      reducedMotion: "no-preference",
    })
    await page.goto("/")
    await page.locator("#home-podcast").scrollIntoViewIfNeeded()
    await expect(page.locator("#home-podcast")).toHaveAttribute(
      "data-podcast-scene-ready",
      "true"
    )
    // Fault injection: a compositor scroll can lead the RAF-driven canvas clip.
    // Leave stale canvas paint behind the native surfaces rather than relying on
    // frame timing to happen to expose a one-frame seam during this test.
    await page.addStyleTag({
      content: "[data-shelf-canvas] { clip-path: none !important; }",
    })
    for (const offset of [420, 250, 420]) {
      await page
        .locator("#store")
        .evaluate(
          (el, y) => scrollTo(0, el.getBoundingClientRect().top + scrollY - y),
          offset
        )
      const row = await page
        .locator("#store")
        .evaluate((el) => Math.ceil(el.getBoundingClientRect().top) + 12)
      const png = await page.screenshot()
      const pixels = await page.evaluate(
        async ({ encoded, y }) => {
          const blob = await (
            await fetch(`data:image/png;base64,${encoded}`)
          ).blob()
          const bitmap = await createImageBitmap(blob)
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
          const context = canvas.getContext("2d")!
          context.drawImage(bitmap, 0, 0)
          return [12, Math.floor(bitmap.width / 2), bitmap.width - 12].map(
            (x) => Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3)
          )
        },
        { encoded: png.toString("base64"), y: row }
      )
      for (const pixel of pixels)
        expect(Math.min(...pixel)).toBeGreaterThan(220)
    }
  })
}
