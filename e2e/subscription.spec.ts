import { STORAGE_PREFIX, clearStore, expect, test } from "./fixtures"

test.describe("subscription page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/subscription", { timeout: 120_000 })
    await clearStore(page)
    await page.reload()
    await page.waitForLoadState("load")
  })

  test("shows the hero, plans, plus books and FAQ", async ({ page }) => {
    await expect(page).toHaveTitle(/اشتراک ماجراجویی/)
    await expect(
      page.getByRole("heading", { level: 1, name: "اشتراک ماجراجویی" })
    ).toBeVisible()
    await expect(page.getByRole("radio")).toHaveCount(3)
    await expect(page.getByRole("radio", { name: "طرح سه‌ماهه" })).toBeChecked()
    await expect(
      page.getByRole("heading", { name: "کتاب‌های اشتراکی" })
    ).toBeVisible()

    const question = page.getByRole("button", { name: "پرداخت واقعی است؟" })
    await question.click()
    await expect(page.getByText("این یک پروژهٔ آموزشی است")).toBeVisible()
    // No status card without a subscription.
    await expect(
      page.getByRole("region", { name: "وضعیت اشتراک" })
    ).toHaveCount(0)
  })

  test("activate yearly, keep it after reload, then cancel", async ({
    page,
  }) => {
    const yearly = page.getByRole("radio", { name: "طرح یک‌ساله" })
    // Retry until hydration has attached the radio group's handlers.
    await expect(async () => {
      await yearly.click()
      await expect(yearly).toBeChecked({ timeout: 1000 })
    }).toPass()

    await page.getByRole("button", { name: "فعال‌سازی اشتراک" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText("تأیید اشتراک یک‌ساله")
    await expect(dialog).toContainText("هزینه‌ای کسر نمی‌شود")
    await dialog.getByRole("button", { name: "تأیید و فعال‌سازی" }).click()

    await expect(dialog).toContainText("اشتراک شما فعال شد")
    await expect(dialog).toContainText("معتبر تا")
    await expect(
      dialog.getByRole("link", { name: "رفتن به کتابخانهٔ من" })
    ).toHaveAttribute("href", "/library")
    await dialog.getByRole("button", { name: "بستن" }).click()
    await expect(dialog).toBeHidden()

    const status = page.getByRole("region", { name: "وضعیت اشتراک" })
    await expect(status).toContainText("اشتراک یک‌ساله")
    await expect(status).toContainText("فعال تا")
    await expect(status.getByRole("progressbar")).toBeVisible()

    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      `${STORAGE_PREFIX}subscription`
    )
    expect(JSON.parse(stored ?? "null")).toMatchObject({ planId: "yearly" })

    await page.reload()
    await expect(status).toContainText("اشتراک یک‌ساله")

    await status.getByRole("button", { name: "لغو اشتراک" }).click()
    const confirm = page.getByRole("dialog")
    await expect(confirm).toContainText("اشتراک لغو شود؟")
    await confirm.getByRole("button", { name: "بله، لغو شود" }).click()
    await expect(status).toHaveCount(0)
    await expect(page.getByText("اشتراک شما لغو شد")).toBeVisible()

    await page.reload()
    await page.waitForLoadState("load")
    await expect(page.getByRole("radio", { name: "طرح سه‌ماهه" })).toBeVisible()
    await expect(status).toHaveCount(0)
  })
})
