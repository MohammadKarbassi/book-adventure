import { describe, expect, it } from "vitest"

import {
  formatClock,
  formatDuration,
  formatNumber,
  formatPrice,
  formatRating,
  toPersianDigits,
} from "@/lib/format"

describe("format", () => {
  it("toPersianDigits", () => {
    expect(toPersianDigits(1405)).toBe("۱۴۰۵")
    expect(toPersianDigits("صفحهٔ 12 از 30")).toBe("صفحهٔ ۱۲ از ۳۰")
    expect(toPersianDigits("بدون عدد")).toBe("بدون عدد")
  })

  it("formatNumber", () => {
    expect(formatNumber(270000)).toBe("۲۷۰٬۰۰۰")
  })

  it("formatPrice", () => {
    expect(formatPrice(270000)).toBe("۲۷۰٬۰۰۰ تومان")
    expect(formatPrice(99000)).toBe("۹۹٬۰۰۰ تومان")
    expect(formatPrice(0)).toBe("رایگان")
  })

  it("formatRating", () => {
    expect(formatRating(4.567)).toBe("۴٫۶")
    expect(formatRating(4)).toBe("۴٫۰")
  })

  it("formatDuration", () => {
    expect(formatDuration(15883)).toBe("۴ ساعت و ۲۴ دقیقه")
    expect(formatDuration(540)).toBe("۹ دقیقه")
    expect(formatDuration(7200)).toBe("۲ ساعت")
    expect(formatDuration(20)).toBe("۱ دقیقه")
  })

  it("formatClock", () => {
    expect(formatClock(3725)).toBe("۱:۰۲:۰۵")
    expect(formatClock(75)).toBe("۱:۱۵")
    expect(formatClock(0)).toBe("۰:۰۰")
    expect(formatClock(-5)).toBe("۰:۰۰")
  })
})
