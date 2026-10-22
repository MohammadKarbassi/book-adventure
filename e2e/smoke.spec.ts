import type { ConsoleMessage, Page } from "@playwright/test"

import { expect, test } from "./fixtures"

/** Failed image loads from external hosts (covers, artwork) are not our bugs. */
function isIgnorable(message: ConsoleMessage, baseURL: string): boolean {
  if (!message.text().startsWith("Failed to load resource")) return false
  const url = message.location().url
  if (!url) return false
  const { origin, pathname } = new URL(url)
  return (
    origin !== new URL(baseURL).origin || pathname.startsWith("/_next/image")
  )
}

function collectErrors(page: Page, baseURL: string): string[] {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error" && !isIgnorable(message, baseURL)) {
      errors.push(message.text())
    }
  })
  page.on("pageerror", (error) => errors.push(error.message))
  return errors
}

test("home page renders in Persian RTL without errors", async ({
  page,
  baseURL,
}) => {
  const errors = collectErrors(page, baseURL!)

  const response = await page.goto("/")
  expect(response?.status()).toBe(200)

  await expect(page.locator("html")).toHaveAttribute("lang", "fa")
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl")
  await expect(page).toHaveTitle(/ماجراجویی با کتاب/)

  await page.waitForLoadState("load")
  // The header search becomes interactive once React has hydrated.
  await page.getByRole("link", { name: "به فروشگاه بروید" }).click()
  await page.getByRole("button", { name: "جستجو" }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
  expect(errors).toEqual([])
})
