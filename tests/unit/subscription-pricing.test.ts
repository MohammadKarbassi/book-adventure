import { describe, expect, it } from "vitest"

import {
  perMonthPrice,
  remainingDays,
  remainingPercent,
  savingsPercent,
} from "@/components/subscription/plan-pricing"
import { getPlan } from "@/lib/plans"

describe("plan pricing", () => {
  it("per-month price is rounded to 100 Toman", () => {
    expect(perMonthPrice(getPlan("monthly"))).toBe(99000)
    expect(perMonthPrice(getPlan("quarterly"))).toBe(83000)
    expect(perMonthPrice(getPlan("yearly"))).toBe(65800)
  })

  it("savings are compared with the monthly plan", () => {
    expect(savingsPercent(getPlan("monthly"))).toBe(0)
    expect(savingsPercent(getPlan("quarterly"))).toBe(16)
    expect(savingsPercent(getPlan("yearly"))).toBe(33)
  })

  it("never reports negative savings", () => {
    expect(savingsPercent({ price: 999_999, months: 3 })).toBe(0)
  })
})

describe("subscription period", () => {
  const subscription = {
    startedAt: "2026-10-01T00:00:00.000Z",
    expiresAt: "2026-10-31T00:00:00.000Z",
  }
  const at = (iso: string) => Date.parse(iso)

  it("remaining days round up and stop at zero", () => {
    expect(remainingDays(subscription, at("2026-10-01T00:00:00.000Z"))).toBe(30)
    expect(remainingDays(subscription, at("2026-10-30T20:00:00.000Z"))).toBe(1)
    expect(remainingDays(subscription, at("2026-11-02T00:00:00.000Z"))).toBe(0)
  })

  it("remaining percent is clamped to 0–100", () => {
    expect(remainingPercent(subscription, at("2026-10-01T00:00:00.000Z"))).toBe(
      100
    )
    expect(remainingPercent(subscription, at("2026-10-16T00:00:00.000Z"))).toBe(
      50
    )
    expect(remainingPercent(subscription, at("2026-12-01T00:00:00.000Z"))).toBe(
      0
    )
    expect(remainingPercent(subscription, at("2026-09-01T00:00:00.000Z"))).toBe(
      100
    )
  })
})
