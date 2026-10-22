"use client"

// Hydration-safe hooks over localStorage. The server render and the first
// client render use the defaults (getServerSnapshot); React then re-renders
// with the stored values right after hydration.

import { useCallback, useMemo, useSyncExternalStore } from "react"

import { accessReason } from "@/lib/access"
import type { ForeignBook } from "@/lib/foreign"
import type { PlanId } from "@/lib/plans"
import { storage, type Validator } from "@/lib/storage"
import {
  addReviewIn,
  cancelSubscriptionIn,
  purchaseIn,
  rememberForeignBookIn,
  subscribeIn,
  toggleFavoriteIn,
} from "@/lib/store-actions"
import {
  STORE_KEYS,
  createId,
  hasPurchase,
  isBoolean,
  isForeignBookRecord,
  isIdList,
  isNumberRecord,
  isPurchaseList,
  isSubscription,
  isSubscriptionActive,
  isUserReviewList,
  reviewsForBook,
  setRecordValue,
  toProgress,
  type Purchase,
  type Subscription,
  type UserReview,
  type UserReviewInput,
} from "@/lib/store-core"

export type { PlanId } from "@/lib/plans"
export type { Purchase, Subscription, UserReview } from "@/lib/store-core"

// Module-level fallbacks keep the default snapshots referentially stable.
const NO_IDS: number[] = []
const NO_PURCHASES: Purchase[] = []
const NO_REVIEWS: UserReview[] = []
const NO_PROGRESS: Record<string, number> = {}
const NO_FOREIGN_BOOKS: Record<string, ForeignBook> = {}

function useStored<T>(name: string, fallback: T, validate: Validator<T>): T {
  const subscribe = useCallback(
    (callback: () => void) => storage.subscribe(name, callback),
    [name]
  )
  return useSyncExternalStore(
    subscribe,
    () => storage.read(name, fallback, validate),
    () => fallback
  )
}

const readProgress = (name: string) =>
  storage.read(name, NO_PROGRESS, isNumberRecord)

const noopSubscribe = () => () => {}

/** false during SSR and hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

// Current time to the minute, so subscription expiry is noticed without
// calling Date.now() during render.
const MINUTE = 60_000
const getNow = () => Math.floor(Date.now() / MINUTE) * MINUTE
function subscribeNow(callback: () => void) {
  const timer = setInterval(callback, MINUTE)
  return () => clearInterval(timer)
}
function useNow(): number {
  return useSyncExternalStore(subscribeNow, getNow, () => 0)
}

export function useFavorites(): {
  favorites: number[]
  isFavorite: (bookId: number) => boolean
  /** New state (true = added), or null when it couldn't be saved. */
  toggleFavorite: (bookId: number) => boolean | null
} {
  const favorites = useStored(STORE_KEYS.favorites, NO_IDS, isIdList)
  const isFavorite = useCallback(
    (bookId: number) => favorites.includes(bookId),
    [favorites]
  )
  const toggleFavorite = useCallback(
    (bookId: number) => toggleFavoriteIn(storage, bookId),
    []
  )
  return { favorites, isFavorite, toggleFavorite }
}

export function usePurchases(): {
  purchases: Purchase[]
  isPurchased: (bookId: number) => boolean
  /** false when the purchase couldn't be saved. */
  purchase: (bookId: number) => boolean
} {
  const purchases = useStored(
    STORE_KEYS.purchases,
    NO_PURCHASES,
    isPurchaseList
  )
  const isPurchased = useCallback(
    (bookId: number) => hasPurchase(purchases, bookId),
    [purchases]
  )
  const purchase = useCallback(
    (bookId: number) => purchaseIn(storage, bookId, new Date()),
    []
  )
  return { purchases, isPurchased, purchase }
}

export function useSubscription(): {
  subscription: Subscription | null
  isActive: boolean
  /** null when the subscription couldn't be saved. */
  subscribe: (planId: PlanId) => Subscription | null
  /** false when the subscription couldn't be removed. */
  cancel: () => boolean
} {
  const subscription = useStored<Subscription | null>(
    STORE_KEYS.subscription,
    null,
    isSubscription
  )
  const now = useNow()
  const isActive = now > 0 && isSubscriptionActive(subscription, now)
  const subscribe = useCallback(
    (planId: PlanId) => subscribeIn(storage, planId, new Date()),
    []
  )
  const cancel = useCallback(() => cancelSubscriptionIn(storage), [])
  return { subscription, isActive, subscribe, cancel }
}

export function useUserReviews(bookId: number): {
  reviews: UserReview[]
  /** null when the review couldn't be saved. */
  addReview: (input: UserReviewInput) => UserReview | null
} {
  const all = useStored(STORE_KEYS.reviews, NO_REVIEWS, isUserReviewList)
  const reviews = useMemo(() => reviewsForBook(all, bookId), [all, bookId])
  const addReview = useCallback(
    (input: UserReviewInput) =>
      addReviewIn(storage, bookId, input, new Date(), createId()),
    [bookId]
  )
  return { reviews, addReview }
}

function useProgress(name: string, key: string): [number, (n: number) => void] {
  const record = useStored(name, NO_PROGRESS, isNumberRecord)
  const value = record[key] ?? 0
  const setValue = useCallback(
    (next: number) => {
      const current = readProgress(name)
      const updated = setRecordValue(current, key, toProgress(next))
      if (updated !== current) storage.write(name, updated)
    },
    [name, key]
  )
  return [value, setValue]
}

/** Page index for the reader, 0 when never opened. */
export function useReaderProgress(bookId: number): {
  page: number
  setPage: (page: number) => void
} {
  const [page, setPage] = useProgress(STORE_KEYS.readerProgress, String(bookId))
  return { page, setPage }
}

/**
 * Playback position in whole seconds. Writes only when the second changes,
 * so calling setPosition from "timeupdate" is fine.
 */
export function useAudioProgress(key: string): {
  position: number
  setPosition: (seconds: number) => void
} {
  const [position, setPosition] = useProgress(STORE_KEYS.audioProgress, key)
  return { position, setPosition }
}

/**
 * Metadata of foreign (Open Library) books the user bought or favorited,
 * keyed by String(book.id), so the library can show them.
 */
export function useForeignBooks(): {
  books: Record<string, ForeignBook>
  /** false when the metadata couldn't be saved. */
  remember: (book: ForeignBook) => boolean
} {
  const books = useStored(
    STORE_KEYS.foreignBooks,
    NO_FOREIGN_BOOKS,
    isForeignBookRecord
  )
  const remember = useCallback(
    (book: ForeignBook) => rememberForeignBookIn(storage, book),
    []
  )
  return { books, remember }
}

/** `seen` is false on the server and during hydration. */
export function useIntroSeen(): { seen: boolean; markSeen: () => void } {
  const seen = useStored(STORE_KEYS.introSeen, false, isBoolean)
  const markSeen = useCallback(() => {
    storage.write(STORE_KEYS.introSeen, true)
  }, [])
  return { seen, markSeen }
}

/** Before hydration only free books are readable (nothing is stored yet). */
export function useBookAccess(book: {
  id: number
  free: boolean
  inPlus: boolean
}): {
  hydrated: boolean
  purchased: boolean
  viaSubscription: boolean
  canRead: boolean
} {
  const hydrated = useHydrated()
  const { isPurchased } = usePurchases()
  const { isActive } = useSubscription()
  const purchased = isPurchased(book.id)
  const reason = accessReason(book, {
    purchased,
    subscriptionActive: isActive,
  })
  return {
    hydrated,
    purchased,
    viaSubscription: reason === "subscription",
    canRead: reason !== null,
  }
}
