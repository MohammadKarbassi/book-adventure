import { describe, expect, it } from "vitest"

import {
  DEFAULT_REVIEW_NAME,
  addMonths,
  addPurchase,
  addUserReview,
  createId,
  createSubscription,
  createUserReview,
  STORE_KEYS,
  hasPurchase,
  isForeignBookRecord,
  isIdList,
  isNumberRecord,
  isPurchaseList,
  isSubscription,
  isUserReviewList,
  isSubscriptionActive,
  rememberForeignBook,
  reviewsForBook,
  setRecordValue,
  toProgress,
  toggleId,
  type Purchase,
} from "@/lib/store-core"
import { toForeignBook, type ForeignBook } from "@/lib/foreign"

const now = new Date("2026-10-22T10:00:00.000Z")

describe("toggleId", () => {
  it("adds new ids to the front", () => {
    expect(toggleId([2, 3], 1)).toEqual([1, 2, 3])
    expect(toggleId([], 5)).toEqual([5])
  })

  it("removes existing ids", () => {
    expect(toggleId([1, 2, 3], 2)).toEqual([1, 3])
  })

  it("does not mutate the input", () => {
    const list = [1]
    toggleId(list, 2)
    toggleId(list, 1)
    expect(list).toEqual([1])
  })
})

describe("addPurchase", () => {
  it("prepends a purchase with an ISO date", () => {
    const old: Purchase = { bookId: 1, purchasedAt: "2026-01-01T00:00:00.000Z" }
    expect(addPurchase([old], 2, now)).toEqual([
      { bookId: 2, purchasedAt: "2026-10-22T10:00:00.000Z" },
      old,
    ])
  })

  it("is idempotent and returns the same list", () => {
    const list = addPurchase([], 1, now)
    expect(addPurchase(list, 1, new Date())).toBe(list)
  })

  it("hasPurchase", () => {
    const list = addPurchase([], 1, now)
    expect(hasPurchase(list, 1)).toBe(true)
    expect(hasPurchase(list, 2)).toBe(false)
  })
})

describe("addMonths", () => {
  it("adds calendar months", () => {
    expect(addMonths(now, 1).toISOString()).toBe("2026-11-22T10:00:00.000Z")
    expect(addMonths(now, 3).toISOString()).toBe("2027-01-22T10:00:00.000Z")
    expect(addMonths(now, 12).toISOString()).toBe("2027-10-22T10:00:00.000Z")
  })

  it("clamps to the end of shorter months", () => {
    const jan31 = new Date("2027-01-31T08:00:00.000Z")
    expect(addMonths(jan31, 1).toISOString()).toBe("2027-02-28T08:00:00.000Z")
    const leap = new Date("2028-01-31T08:00:00.000Z")
    expect(addMonths(leap, 1).toISOString()).toBe("2028-02-29T08:00:00.000Z")
  })
})

describe("subscriptions", () => {
  it("createSubscription uses the plan's months", () => {
    expect(createSubscription("monthly", now)).toEqual({
      planId: "monthly",
      startedAt: "2026-10-22T10:00:00.000Z",
      expiresAt: "2026-11-22T10:00:00.000Z",
    })
    expect(createSubscription("quarterly", now).expiresAt).toBe(
      "2027-01-22T10:00:00.000Z"
    )
    expect(createSubscription("yearly", now).expiresAt).toBe(
      "2027-10-22T10:00:00.000Z"
    )
  })

  it("isSubscriptionActive", () => {
    const sub = createSubscription("monthly", now)
    expect(isSubscriptionActive(null, now)).toBe(false)
    expect(isSubscriptionActive(sub, now)).toBe(true)
    expect(isSubscriptionActive(sub, now.getTime())).toBe(true)
    expect(isSubscriptionActive(sub, new Date(sub.expiresAt))).toBe(false)
    expect(isSubscriptionActive(sub, new Date("2027-01-01"))).toBe(false)
  })
})

describe("reviews", () => {
  it("createUserReview trims, defaults the name and clamps the rating", () => {
    expect(
      createUserReview(
        1,
        { name: "  سارا ", rating: 4, text: " عالی " },
        now,
        "a"
      )
    ).toEqual({
      id: "a",
      bookId: 1,
      name: "سارا",
      rating: 4,
      text: "عالی",
      createdAt: "2026-10-22T10:00:00.000Z",
    })
    const anon = createUserReview(
      1,
      { name: " ", rating: 9, text: "x" },
      now,
      "b"
    )
    expect(anon.name).toBe(DEFAULT_REVIEW_NAME)
    expect(anon.rating).toBe(5)
    expect(
      createUserReview(1, { name: "a", rating: 0, text: "" }, now, "c").rating
    ).toBe(1)
    expect(
      createUserReview(1, { name: "a", rating: 3.6, text: "" }, now, "d").rating
    ).toBe(4)
    expect(
      createUserReview(1, { name: "a", rating: NaN, text: "" }, now, "e").rating
    ).toBe(5)
  })

  it("addUserReview is newest first and reviewsForBook filters", () => {
    const a = createUserReview(1, { name: "a", rating: 5, text: "" }, now, "a")
    const b = createUserReview(2, { name: "b", rating: 3, text: "" }, now, "b")
    const c = createUserReview(1, { name: "c", rating: 4, text: "" }, now, "c")
    const list = addUserReview(addUserReview(addUserReview([], a), b), c)
    expect(list.map((r) => r.id)).toEqual(["c", "b", "a"])
    expect(reviewsForBook(list, 1).map((r) => r.id)).toEqual(["c", "a"])
    expect(reviewsForBook(list, 3)).toEqual([])
  })

  it("createId returns unique strings", () => {
    const ids = new Set(Array.from({ length: 50 }, createId))
    expect(ids.size).toBe(50)
  })
})

describe("progress", () => {
  it("toProgress floors to a non-negative integer", () => {
    expect(toProgress(12.9)).toBe(12)
    expect(toProgress(-3)).toBe(0)
    expect(toProgress(NaN)).toBe(0)
    expect(toProgress(Infinity)).toBe(0)
  })

  it("setRecordValue returns the same record when unchanged", () => {
    const record = { "1": 3 }
    expect(setRecordValue(record, "1", 3)).toBe(record)
    const next = setRecordValue(record, "1", 4)
    expect(next).toEqual({ "1": 4 })
    expect(record).toEqual({ "1": 3 })
    expect(setRecordValue(record, "ep", 10)).toEqual({ "1": 3, ep: 10 })
  })
})

describe("validators", () => {
  it("isIdList", () => {
    expect(isIdList([1, 2])).toBe(true)
    expect(isIdList([])).toBe(true)
    expect(isIdList(["1"])).toBe(false)
    expect(isIdList({})).toBe(false)
  })

  it("isPurchaseList", () => {
    expect(isPurchaseList(addPurchase([], 1, now))).toBe(true)
    expect(isPurchaseList([{ bookId: 1 }])).toBe(false)
    expect(isPurchaseList([{ bookId: 1, purchasedAt: "nope" }])).toBe(false)
  })

  it("isSubscription", () => {
    expect(isSubscription(null)).toBe(true)
    expect(isSubscription(createSubscription("yearly", now))).toBe(true)
    expect(
      isSubscription({ ...createSubscription("yearly", now), planId: "weekly" })
    ).toBe(false)
    expect(isSubscription("monthly")).toBe(false)
  })

  it("isUserReviewList", () => {
    const review = createUserReview(
      1,
      { name: "a", rating: 5, text: "" },
      now,
      "a"
    )
    expect(isUserReviewList([review])).toBe(true)
    expect(isUserReviewList([{ ...review, rating: "5" }])).toBe(false)
  })

  it("isNumberRecord", () => {
    expect(isNumberRecord({ a: 1 })).toBe(true)
    expect(isNumberRecord({ a: "1" })).toBe(false)
    expect(isNumberRecord([1])).toBe(false)
    expect(isNumberRecord(null)).toBe(false)
  })
})

describe("foreign books", () => {
  const book = toForeignBook({
    key: "/works/OL46401W",
    title: "The Caves of Steel",
    author_name: ["Isaac Asimov"],
    cover_i: 13790511,
    first_publish_year: 1953,
  }) as ForeignBook

  it("has its own storage key", () => {
    expect(STORE_KEYS.foreignBooks).toBe("foreignBooks")
  })

  it("remembers a book under String(id)", () => {
    const record = rememberForeignBook({}, book)
    expect(record).toEqual({ [String(book.id)]: book })
    expect(isForeignBookRecord(record)).toBe(true)
  })

  it("returns the same record when nothing changes", () => {
    const record = rememberForeignBook({}, book)
    expect(rememberForeignBook(record, { ...book })).toBe(record)
    // A stored (JSON round-tripped) copy counts as unchanged too.
    const stored = JSON.parse(JSON.stringify(record)) as typeof record
    expect(rememberForeignBook(stored, book)).toBe(stored)
  })

  it("updates changed metadata without mutating the input", () => {
    const record = rememberForeignBook({}, book)
    const next = rememberForeignBook(record, { ...book, pages: 270 })
    expect(next).not.toBe(record)
    expect(next[String(book.id)].pages).toBe(270)
    expect(record[String(book.id)].pages).toBeUndefined()
  })

  it("validates the stored record", () => {
    expect(isForeignBookRecord({})).toBe(true)
    expect(isForeignBookRecord({ "1": book })).toBe(false)
    expect(isForeignBookRecord({ [String(book.id)]: { title: "x" } })).toBe(
      false
    )
    expect(isForeignBookRecord([book])).toBe(false)
    expect(isForeignBookRecord(null)).toBe(false)
  })
})
