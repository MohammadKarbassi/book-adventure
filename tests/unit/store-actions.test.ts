import { describe, expect, it } from "vitest"

import { toForeignBook, type ForeignBook } from "@/lib/foreign"
import { createStorage, storageKey, type StorageLike } from "@/lib/storage"
import {
  addReviewIn,
  cancelSubscriptionIn,
  purchaseIn,
  rememberForeignBookIn,
  subscribeIn,
  toggleFavoriteIn,
} from "@/lib/store-actions"

const now = new Date("2026-10-22T10:00:00.000Z")

/** In-memory storage whose writes can be switched off (full/blocked). */
class FakeStorage implements StorageLike {
  data = new Map<string, string>()
  broken = false
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    if (this.broken) throw new Error("QuotaExceededError")
    this.data.set(key, value)
  }
  removeItem(key: string) {
    if (this.broken) throw new Error("SecurityError")
    this.data.delete(key)
  }
}

function setup() {
  const fake = new FakeStorage()
  return { fake, store: createStorage(() => fake) }
}

const book = toForeignBook({
  key: "/works/OL46401W",
  title: "The Caves of Steel",
  author_name: ["Isaac Asimov"],
}) as ForeignBook

describe("store actions report failed writes", () => {
  it("toggleFavoriteIn returns the new state, or null when not saved", () => {
    const { fake, store } = setup()
    expect(toggleFavoriteIn(store, 7)).toBe(true)
    expect(toggleFavoriteIn(store, 7)).toBe(false)
    fake.broken = true
    expect(toggleFavoriteIn(store, 7)).toBeNull()
    expect(fake.data.get(storageKey("favorites"))).toBe("[]")
  })

  it("purchaseIn returns false when the purchase isn't stored", () => {
    const { fake, store } = setup()
    fake.broken = true
    expect(purchaseIn(store, 7, now)).toBe(false)
    expect(fake.data.size).toBe(0)
    fake.broken = false
    expect(purchaseIn(store, 7, now)).toBe(true)
    // Already owned: nothing to write, still a success.
    fake.broken = true
    expect(purchaseIn(store, 7, now)).toBe(true)
  })

  it("subscribeIn returns null when not saved", () => {
    const { fake, store } = setup()
    expect(subscribeIn(store, "monthly", now)?.planId).toBe("monthly")
    fake.broken = true
    expect(subscribeIn(store, "yearly", now)).toBeNull()
  })

  it("cancelSubscriptionIn returns false when the key can't be removed", () => {
    const { fake, store } = setup()
    subscribeIn(store, "monthly", now)
    fake.broken = true
    expect(cancelSubscriptionIn(store)).toBe(false)
    expect(fake.data.has(storageKey("subscription"))).toBe(true)
    fake.broken = false
    expect(cancelSubscriptionIn(store)).toBe(true)
    expect(fake.data.has(storageKey("subscription"))).toBe(false)
  })

  it("addReviewIn returns null when not saved", () => {
    const { fake, store } = setup()
    const input = {
      name: "",
      rating: 4,
      text: "کتاب خوبی بود، پیشنهاد می‌کنم.",
    }
    expect(addReviewIn(store, 7, input, now, "a")?.id).toBe("a")
    fake.broken = true
    expect(addReviewIn(store, 7, input, now, "b")).toBeNull()
    expect(store.read("reviews", [])).toHaveLength(1)
  })

  it("rememberForeignBookIn returns false when not saved", () => {
    const { fake, store } = setup()
    fake.broken = true
    expect(rememberForeignBookIn(store, book)).toBe(false)
    fake.broken = false
    expect(rememberForeignBookIn(store, book)).toBe(true)
    // Unchanged copy: no write needed.
    fake.broken = true
    expect(rememberForeignBookIn(store, book)).toBe(true)
  })
})
