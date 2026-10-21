import { describe, expect, it } from "vitest"

import {
  getAllBooks,
  getBook,
  getBooksByCategory,
  getCategories,
  getSimilarBooks,
  normalizePersian,
  searchBooks,
} from "@/lib/catalog"

describe("catalog", () => {
  it("getBook accepts numbers and strings", () => {
    const first = getAllBooks()[0]
    expect(getBook(first.id)).toBe(first)
    expect(getBook(String(first.id))).toBe(first)
    expect(getBook(-1)).toBeUndefined()
    expect(getBook("not-a-number")).toBeUndefined()
  })

  it("getBooksByCategory returns only that category", () => {
    for (const category of getCategories()) {
      const books = getBooksByCategory(category.slug)
      expect(books.every((book) => book.categorySlug === category.slug)).toBe(
        true
      )
    }
    const total = getCategories().reduce(
      (sum, category) => sum + getBooksByCategory(category.slug).length,
      0
    )
    expect(total).toBe(getAllBooks().length)
    expect(getBooksByCategory("no-such-category")).toEqual([])
  })

  it("getSimilarBooks excludes itself and prefers the same type", () => {
    for (const book of getAllBooks()) {
      const similar = getSimilarBooks(book)
      expect(similar.length).toBeLessThanOrEqual(8)
      expect(similar.some((other) => other.id === book.id)).toBe(false)
      expect(
        similar.every((other) => other.categorySlug === book.categorySlug)
      ).toBe(true)
      // Same-type books come before any other type.
      const sameType = similar.map((other) => other.type === book.type)
      const firstOtherType = sameType.indexOf(false)
      if (firstOtherType !== -1) {
        expect(sameType.slice(firstOtherType)).not.toContain(true)
      }
    }
    const book = getAllBooks()[0]
    expect(getSimilarBooks(book, 3).length).toBeLessThanOrEqual(3)
  })

  it("normalizePersian unifies Arabic letters, ZWNJ and spacing", () => {
    expect(normalizePersian("كيمياگر")).toBe("کیمیاگر")
    expect(normalizePersian("  می‌خواهم   ")).toBe("میخواهم")
  })

  it("searchBooks finds Arabic-letter queries", () => {
    const titles = searchBooks("كيمياگر").map((book) => book.title)
    expect(titles).toContain("کیمیاگر")
  })

  it("searchBooks finds by author", () => {
    const results = searchBooks("کوئیلو")
    expect(results.length).toBeGreaterThan(0)
    expect(
      results.every((book) =>
        book.authors.some((author) => author.includes("کوئیلو"))
      )
    ).toBe(true)
  })

  it("searchBooks requires every word", () => {
    expect(searchBooks("کیمیاگر کوئیلو").map((book) => book.title)).toContain(
      "کیمیاگر"
    )
    expect(searchBooks("کیمیاگر zzzzqq")).toEqual([])
  })

  it("searchBooks returns nothing for an empty query", () => {
    expect(searchBooks("")).toEqual([])
    expect(searchBooks("   ")).toEqual([])
  })
})
