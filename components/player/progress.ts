// Pure helpers for the player's stored state (positions per track and the
// playback rate). They take the storage instance so they run in Node tests.

import type { TypedStorage } from "@/lib/storage"
import {
  STORE_KEYS,
  isNumberRecord,
  setRecordValue,
  toProgress,
} from "@/lib/store-core"

export const RATE_KEY = "playbackRate"

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const

/** Seconds skipped by the back/forward buttons. */
export const SKIP_SECONDS = 15

/** Saved positions this close to the end start the track over. */
const END_MARGIN_SECONDS = 5

const NO_POSITIONS: Record<string, number> = {}

export function isPlaybackRate(value: unknown): value is number {
  return PLAYBACK_RATES.some((rate) => rate === value)
}

function readAll(store: TypedStorage): Record<string, number> {
  return store.read(STORE_KEYS.audioProgress, NO_POSITIONS, isNumberRecord)
}

/** Saved position in whole seconds, 0 when never played. */
export function readPosition(store: TypedStorage, id: string): number {
  return readAll(store)[id] ?? 0
}

/** Writes only when the whole-second value changes. */
export function writePosition(
  store: TypedStorage,
  id: string,
  seconds: number
): void {
  const current = readAll(store)
  const updated = setRecordValue(current, id, toProgress(seconds))
  if (updated !== current) store.write(STORE_KEYS.audioProgress, updated)
}

export function clearPosition(store: TypedStorage, id: string): void {
  const current = readAll(store)
  if (!(id in current)) return
  const rest = { ...current }
  delete rest[id]
  store.write(STORE_KEYS.audioProgress, rest)
}

/**
 * Where to start a track: the saved position, unless it is missing or so
 * close to the end (when the duration is known) that resuming makes no sense.
 */
export function resumePosition(
  saved: number,
  duration: number | null | undefined
): number {
  if (!Number.isFinite(saved) || saved < 1) return 0
  if (duration && saved >= duration - END_MARGIN_SECONDS) return 0
  return saved
}

/** Clamps a seek target into [0, duration] (no upper bound when unknown). */
export function clampTime(seconds: number, duration: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) return 0
  return duration > 0 ? Math.min(seconds, duration) : seconds
}
