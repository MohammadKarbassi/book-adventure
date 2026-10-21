import { describe, expect, it } from "vitest"

import {
  STORAGE_PREFIX,
  createStorage,
  storageKey,
  type StorageLike,
} from "@/lib/storage"
import { isIdList } from "@/lib/store-core"

class FakeStorage implements StorageLike {
  data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
}

function setup() {
  const fake = new FakeStorage()
  return { fake, store: createStorage(() => fake) }
}

describe("storageKey", () => {
  it("namespaces names", () => {
    expect(STORAGE_PREFIX).toBe("book-adventure:v1:")
    expect(storageKey("favorites")).toBe("book-adventure:v1:favorites")
  })
})

describe("createStorage", () => {
  it("round-trips JSON under the namespaced key", () => {
    const { fake, store } = setup()
    expect(store.write("favorites", [1, 2])).toBe(true)
    expect(fake.data.get("book-adventure:v1:favorites")).toBe("[1,2]")
    expect(store.read("favorites", [])).toEqual([1, 2])
  })

  it("returns the fallback for a missing key", () => {
    const { store } = setup()
    const fallback: number[] = []
    expect(store.read("favorites", fallback)).toBe(fallback)
  })

  it("returns the fallback for corrupt JSON", () => {
    const { fake, store } = setup()
    fake.setItem(storageKey("favorites"), "{not json")
    expect(store.read("favorites", [7])).toEqual([7])
  })

  it("returns the fallback when the validator rejects the value", () => {
    const { fake, store } = setup()
    fake.setItem(storageKey("favorites"), '{"a":1}')
    const fallback: number[] = []
    expect(store.read("favorites", fallback, isIdList)).toBe(fallback)
  })

  it("returns the fallback when storage is missing", () => {
    const store = createStorage(() => null)
    expect(store.read("favorites", "x")).toBe("x")
    expect(store.write("favorites", [1])).toBe(false)
  })

  it("survives storage that throws", () => {
    const store = createStorage(() => ({
      getItem: () => {
        throw new Error("SecurityError")
      },
      setItem: () => {
        throw new Error("QuotaExceededError")
      },
      removeItem: () => {
        throw new Error("SecurityError")
      },
    }))
    expect(store.read("favorites", 1)).toBe(1)
    expect(store.write("favorites", [1])).toBe(false)
    expect(() => store.remove("favorites")).not.toThrow()
  })

  it("defaults to no storage in Node (SSR)", () => {
    const store = createStorage()
    expect(store.read("favorites", "ssr")).toBe("ssr")
    expect(store.write("favorites", 1)).toBe(false)
  })

  it("keeps snapshots referentially stable until the raw value changes", () => {
    const { fake, store } = setup()
    store.write("list", [1])
    const first = store.read("list", [])
    expect(store.read("list", [])).toBe(first)
    store.write("list", [1, 2])
    const second = store.read("list", [])
    expect(second).not.toBe(first)
    expect(second).toEqual([1, 2])
    // Another tab writes the same value: same raw string, same reference.
    fake.setItem(storageKey("list"), "[1,2]")
    expect(store.read("list", [])).toBe(second)
  })

  it("removes a key", () => {
    const { fake, store } = setup()
    store.write("subscription", { planId: "monthly" })
    store.remove("subscription")
    expect(fake.data.size).toBe(0)
    expect(store.read("subscription", null)).toBeNull()
  })

  it("subscribe is a no-op without window", () => {
    const { store } = setup()
    const unsubscribe = store.subscribe("favorites", () => {})
    expect(() => unsubscribe()).not.toThrow()
  })
})
