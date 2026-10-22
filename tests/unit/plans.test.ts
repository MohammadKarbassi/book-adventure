import { describe, expect, it } from "vitest"

import { SUBSCRIPTION_PLANS, getPlan, isPlanId } from "@/lib/plans"

describe("plans", () => {
  it("has the three plans in order", () => {
    expect(
      SUBSCRIPTION_PLANS.map(({ id, title, months, price, badge }) => ({
        id,
        title,
        months,
        price,
        badge,
      }))
    ).toEqual([
      {
        id: "monthly",
        title: "یک‌ماهه",
        months: 1,
        price: 99000,
        badge: undefined,
      },
      {
        id: "quarterly",
        title: "سه‌ماهه",
        months: 3,
        price: 249000,
        badge: "محبوب‌ترین",
      },
      {
        id: "yearly",
        title: "یک‌ساله",
        months: 12,
        price: 790000,
        badge: "به‌صرفه‌ترین",
      },
    ])
  })

  it("every plan has a description and features", () => {
    for (const plan of SUBSCRIPTION_PLANS) {
      expect(plan.description.length).toBeGreaterThan(0)
      expect(plan.features.length).toBeGreaterThan(0)
      expect(plan.features).toContain("دسترسی به همهٔ کتاب‌های اشتراکی")
    }
  })

  it("promises only what works without accounts or a server", () => {
    const features = SUBSCRIPTION_PLANS.flatMap((plan) => plan.features)
    for (const feature of features) {
      expect(feature).not.toMatch(/دستگاه|زودهنگام|همگام/)
    }
    expect(getPlan("monthly").features).toEqual([
      "دسترسی به همهٔ کتاب‌های اشتراکی",
      "شنیدن کتاب‌های صوتی اشتراکی",
      "ذخیرهٔ جای خواندن و شنیدن در همین مرورگر",
      "لغو در هر زمان",
    ])
    expect(getPlan("quarterly").features).toContain("سه ماه دسترسی پیوسته")
    expect(getPlan("yearly").features).toEqual(
      expect.arrayContaining([
        "دوازده ماه دسترسی پیوسته",
        "کم‌ترین هزینهٔ ماهانه",
      ])
    )
  })

  it("longer plans are cheaper per month", () => {
    const perMonth = SUBSCRIPTION_PLANS.map((plan) => plan.price / plan.months)
    expect([...perMonth].sort((a, b) => b - a)).toEqual(perMonth)
  })

  it("getPlan / isPlanId", () => {
    expect(getPlan("quarterly").months).toBe(3)
    expect(getPlan("weekly")).toBeUndefined()
    expect(isPlanId("yearly")).toBe(true)
    expect(isPlanId("weekly")).toBe(false)
    expect(isPlanId(undefined)).toBe(false)
  })
})
