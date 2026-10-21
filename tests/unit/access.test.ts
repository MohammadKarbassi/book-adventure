import { describe, expect, it } from "vitest"

import { accessReason, canAccess } from "@/lib/access"

const cases = [
  // free, inPlus, purchased, subscriptionActive → reason
  [true, false, false, false, "free"],
  [true, true, true, true, "free"],
  [false, false, true, false, "purchased"],
  [false, true, true, true, "purchased"],
  [false, true, false, true, "subscription"],
  [false, true, false, false, null],
  [false, false, false, true, null],
  [false, false, false, false, null],
] as const

describe("accessReason / canAccess", () => {
  it.each(cases)(
    "free=%s inPlus=%s purchased=%s subscription=%s → %s",
    (free, inPlus, purchased, subscriptionActive, reason) => {
      const book = { free, inPlus }
      const state = { purchased, subscriptionActive }
      expect(accessReason(book, state)).toBe(reason)
      expect(canAccess(book, state)).toBe(reason !== null)
    }
  )
})
