// Pure state transitions and validators for the user's localStorage data.
// No React here: lib/store.ts wires these into hooks, tests call them directly.

import { getPlan, isPlanId, type PlanId } from "@/lib/plans"

export type Purchase = { bookId: number; purchasedAt: string } // ISO
export type Subscription = {
  planId: PlanId
  startedAt: string
  expiresAt: string
}
export type UserReview = {
  id: string
  bookId: number
  name: string
  rating: number
  text: string
  createdAt: string
}
export type UserReviewInput = { name: string; rating: number; text: string }

/** Storage names (keys are "book-adventure:v1:<name>"). */
export const STORE_KEYS = {
  favorites: "favorites",
  purchases: "purchases",
  subscription: "subscription",
  reviews: "reviews",
  readerProgress: "readerProgress",
  audioProgress: "audioProgress",
  introSeen: "introSeen",
} as const

export const DEFAULT_REVIEW_NAME = "کاربر مهمان"

// Validators: anything else in storage (old shape, hand-edited) → fallback.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value))

export function isIdList(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(Number.isInteger)
}

export function isPurchaseList(value: unknown): value is Purchase[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        Number.isInteger(item.bookId) &&
        isIsoDate(item.purchasedAt)
    )
  )
}

export function isSubscription(value: unknown): value is Subscription | null {
  if (value === null) return true
  return (
    isRecord(value) &&
    isPlanId(value.planId) &&
    isIsoDate(value.startedAt) &&
    isIsoDate(value.expiresAt)
  )
}

export function isUserReviewList(value: unknown): value is UserReview[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        Number.isInteger(item.bookId) &&
        typeof item.name === "string" &&
        typeof item.rating === "number" &&
        typeof item.text === "string" &&
        isIsoDate(item.createdAt)
    )
  )
}

export function isNumberRecord(
  value: unknown
): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.values(value).every(
      (item) => typeof item === "number" && Number.isFinite(item)
    )
  )
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean"
}

// Favorites

/** Removes `id` if present, otherwise adds it to the front (newest first). */
export function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [id, ...list]
}

// Purchases

/** Newest first; buying an owned book again returns the same list. */
export function addPurchase(
  list: Purchase[],
  bookId: number,
  now: Date
): Purchase[] {
  if (list.some((item) => item.bookId === bookId)) return list
  return [{ bookId, purchasedAt: now.toISOString() }, ...list]
}

export function hasPurchase(list: Purchase[], bookId: number): boolean {
  return list.some((item) => item.bookId === bookId)
}

// Subscription

/** Adds calendar months in UTC, clamping to the month's last day (Jan 31 + 1 → Feb 28/29). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime())
  const day = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate()
  result.setUTCDate(Math.min(day, lastDay))
  return result
}

export function createSubscription(planId: PlanId, now: Date): Subscription {
  return {
    planId,
    startedAt: now.toISOString(),
    expiresAt: addMonths(now, getPlan(planId).months).toISOString(),
  }
}

export function isSubscriptionActive(
  subscription: Subscription | null,
  now: Date | number
): boolean {
  if (!subscription) return false
  return Date.parse(subscription.expiresAt) > new Date(now).getTime()
}

// Reviews

/** Trims the text, defaults the name and rounds the rating into 1–5. */
export function createUserReview(
  bookId: number,
  input: UserReviewInput,
  now: Date,
  id: string
): UserReview {
  const rating = Number.isFinite(input.rating) ? Math.round(input.rating) : 5
  return {
    id,
    bookId,
    name: input.name.trim() || DEFAULT_REVIEW_NAME,
    rating: Math.min(5, Math.max(1, rating)),
    text: input.text.trim(),
    createdAt: now.toISOString(),
  }
}

/** Newest first. */
export function addUserReview(
  list: UserReview[],
  review: UserReview
): UserReview[] {
  return [review, ...list]
}

export function reviewsForBook(
  list: UserReview[],
  bookId: number
): UserReview[] {
  return list.filter((review) => review.bookId === bookId)
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

// Reader page and audio position, kept as one map per kind.

/** Non-negative whole number (pages, seconds). */
export function toProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

/** Returns the same record when nothing changes, so no write is needed. */
export function setRecordValue(
  record: Record<string, number>,
  key: string,
  value: number
): Record<string, number> {
  if (record[key] === value) return record
  return { ...record, [key]: value }
}
