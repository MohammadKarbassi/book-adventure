import { describe, expect, it } from "vitest"

import {
  cleanText,
  discountAmount,
  excerpt,
  formatReviewDate,
  hasErrors,
  initialOf,
  isLatin,
  parseBookId,
  validateReview,
} from "@/components/book-detail/book-detail-utils"
import { buildBookTrack } from "@/components/book-detail/book-track"
import type { AudioSample } from "@/lib/audio-samples"

describe("parseBookId", () => {
  it("accepts plain positive integers", () => {
    expect(parseBookId("1631")).toBe(1631)
  })
  it.each(["", "abc", "0", "01631", "1631.0", "-5", "1e3", " 12"])(
    "rejects %j",
    (value) => {
      expect(parseBookId(value)).toBeNull()
    }
  )
})

describe("excerpt", () => {
  it("keeps short text as is", () => {
    expect(excerpt("  یک   متن کوتاه ")).toBe("یک متن کوتاه")
  })
  it("cuts long text at a word boundary with an ellipsis", () => {
    const text = "کلمه ".repeat(60)
    const result = excerpt(text, 40)
    expect(result.length).toBeLessThanOrEqual(40)
    expect(result.endsWith("کلمه…")).toBe(true)
  })
  it("drops trailing punctuation before the ellipsis", () => {
    expect(excerpt("الف ب، پ ت ث ج چ ح خ د", 8)).toBe("الف ب…")
  })
})

describe("cleanText / isLatin", () => {
  it("removes direction marks around Latin titles", () => {
    expect(cleanText("‌‫‪The compound  effect‬‬")).toBe("The compound effect")
  })
  it("detects Latin-only text", () => {
    expect(isLatin("When Nietzsche Wept")).toBe(true)
    expect(isLatin("سمفونی مردگان")).toBe(false)
    expect(isLatin("1984")).toBe(false)
  })
})

describe("formatReviewDate / initialOf", () => {
  it("uses slashes and Persian digits", () => {
    expect(formatReviewDate("۱۴۰۰-۱۰-۰۵")).toBe("۱۴۰۰/۱۰/۰۵")
    expect(formatReviewDate("1400-10-05")).toBe("۱۴۰۰/۱۰/۰۵")
  })
  it("takes the first letter of a name", () => {
    expect(initialOf("  مریم")).toBe("م")
    expect(initialOf("")).toBe("؟")
  })
})

describe("validateReview", () => {
  it("requires a rating and text", () => {
    const errors = validateReview({ rating: 0, text: "  " })
    expect(errors.rating).toBeTruthy()
    expect(errors.text).toBe("متن نظر را بنویسید.")
    expect(hasErrors(errors)).toBe(true)
  })
  it("requires at least 10 characters of text", () => {
    expect(validateReview({ rating: 4, text: "کوتاه" }).text).toContain("۱۰")
  })
  it("rejects ratings outside 1–5", () => {
    const errors = validateReview({ rating: 6, text: "متنی به اندازهٔ کافی" })
    expect(errors.rating).toBeTruthy()
  })
  it("passes a complete review", () => {
    const errors = validateReview({ rating: 5, text: "کتاب خیلی خوبی بود." })
    expect(errors).toEqual({})
    expect(hasErrors(errors)).toBe(false)
  })
})

describe("discountAmount", () => {
  it("returns the saving, or 0 without a discount", () => {
    expect(discountAmount({ finalPrice: 85500, price: 95000 })).toBe(9500)
    expect(discountAmount({ finalPrice: 85500 })).toBe(0)
    expect(discountAmount({ finalPrice: 100, price: 100 })).toBe(0)
  })
})

describe("buildBookTrack", () => {
  const sample: AudioSample = {
    id: "s",
    title: "نمونه",
    language: "fa",
    audioUrl: "https://archive.org/download/x.mp3",
    durationSeconds: 120,
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attribution: "Someone",
    sourceUrl: "https://archive.org/details/x",
  }
  const book = {
    id: 42,
    title: "کتاب",
    authors: ["نویسنده"],
    image: "https://cdn.fidibo.com/a.jpg",
    color: { dominant: "#123456" },
  }

  it("builds the player track from the book and its sample", () => {
    expect(
      buildBookTrack({ ...book, narrators: ["الف", "ب"] }, sample)
    ).toEqual({
      id: "book-42",
      title: "کتاب",
      subtitle: "الف، ب",
      artwork: book.image,
      src: sample.audioUrl,
      href: "/book/42",
      color: "#123456",
      attribution: "نمونه — Someone (CC BY 4.0)",
      durationSeconds: 120,
    })
  })

  it("falls back to the authors without narrators", () => {
    expect(buildBookTrack(book, sample).subtitle).toBe("نویسنده")
  })

  it("picks a real sample by default", () => {
    expect(buildBookTrack(book).src).toMatch(/^https:\/\//)
  })
})
