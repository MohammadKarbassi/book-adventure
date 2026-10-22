import { describe, expect, it } from "vitest"

import {
  PLAYBACK_RATES,
  clampTime,
  clearPosition,
  isPlaybackRate,
  readPosition,
  resumePosition,
  writePosition,
} from "@/components/player/progress"
import { createStorage, storageKey, type StorageLike } from "@/lib/storage"
import { STORE_KEYS } from "@/lib/store-core"

class FakeStorage implements StorageLike {
  data = new Map<string, string>()
  writes = 0
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.writes += 1
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

describe("saved positions", () => {
  it("reads 0 for tracks never played", () => {
    const { store } = setup()
    expect(readPosition(store, "ep-1-a")).toBe(0)
  })

  it("stores whole seconds per track under audioProgress", () => {
    const { fake, store } = setup()
    writePosition(store, "ep-1-a", 42.8)
    writePosition(store, "sample-7", 3)
    expect(readPosition(store, "ep-1-a")).toBe(42)
    expect(
      JSON.parse(fake.getItem(storageKey(STORE_KEYS.audioProgress))!)
    ).toEqual({ "ep-1-a": 42, "sample-7": 3 })
  })

  it("skips the write when the second hasn't changed", () => {
    const { fake, store } = setup()
    writePosition(store, "ep-1-a", 10.1)
    writePosition(store, "ep-1-a", 10.9)
    expect(fake.writes).toBe(1)
  })

  it("clears one track and keeps the others", () => {
    const { store } = setup()
    writePosition(store, "a", 5)
    writePosition(store, "b", 6)
    clearPosition(store, "a")
    expect(readPosition(store, "a")).toBe(0)
    expect(readPosition(store, "b")).toBe(6)
  })

  it("ignores corrupt stored data", () => {
    const { fake, store } = setup()
    fake.setItem(storageKey(STORE_KEYS.audioProgress), '{"a":"x"}')
    expect(readPosition(store, "a")).toBe(0)
  })
})

describe("resumePosition", () => {
  it("resumes from the saved second", () => {
    expect(resumePosition(120, 3600)).toBe(120)
    expect(resumePosition(120, null)).toBe(120)
  })

  it("starts over when nothing useful is saved or it is near the end", () => {
    expect(resumePosition(0, 3600)).toBe(0)
    expect(resumePosition(Number.NaN, 3600)).toBe(0)
    expect(resumePosition(3597, 3600)).toBe(0)
  })
})

describe("clampTime", () => {
  it("keeps seeks inside the track", () => {
    expect(clampTime(-5, 100)).toBe(0)
    expect(clampTime(150, 100)).toBe(100)
    expect(clampTime(50, 100)).toBe(50)
    expect(clampTime(500, 0)).toBe(500)
  })
})

describe("isPlaybackRate", () => {
  it("accepts only the offered speeds", () => {
    for (const rate of PLAYBACK_RATES) expect(isPlaybackRate(rate)).toBe(true)
    expect(isPlaybackRate(3)).toBe(false)
    expect(isPlaybackRate("1")).toBe(false)
  })
})
