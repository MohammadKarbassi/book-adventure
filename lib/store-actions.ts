// Read-modify-write actions over a TypedStorage. No React, so tests can run
// them against fake storage; lib/store.ts passes the real one. Each action
// reports failure (false / null) when the browser refuses the write, so the
// UI never claims something was saved when it wasn't.

import type { ForeignBook } from "@/lib/foreign"
import type { PlanId } from "@/lib/plans"
import type { TypedStorage } from "@/lib/storage"
import {
  STORE_KEYS,
  addPurchase,
  addUserReview,
  createSubscription,
  createUserReview,
  isForeignBookRecord,
  isIdList,
  isPurchaseList,
  isUserReviewList,
  rememberForeignBook,
  toggleId,
  type Purchase,
  type Subscription,
  type UserReview,
  type UserReviewInput,
} from "@/lib/store-core"

export type ActionStorage = Pick<TypedStorage, "read" | "write" | "remove">

/** New state (true = now a favorite), or null when it couldn't be saved. */
export function toggleFavoriteIn(
  store: ActionStorage,
  bookId: number
): boolean | null {
  const next = toggleId(
    store.read<number[]>(STORE_KEYS.favorites, [], isIdList),
    bookId
  )
  if (!store.write(STORE_KEYS.favorites, next)) return null
  return next.includes(bookId)
}

/** true when the book is (or already was) owned. */
export function purchaseIn(
  store: ActionStorage,
  bookId: number,
  now: Date
): boolean {
  const current = store.read<Purchase[]>(
    STORE_KEYS.purchases,
    [],
    isPurchaseList
  )
  const next = addPurchase(current, bookId, now)
  return next === current || store.write(STORE_KEYS.purchases, next)
}

export function subscribeIn(
  store: ActionStorage,
  planId: PlanId,
  now: Date
): Subscription | null {
  const next = createSubscription(planId, now)
  return store.write(STORE_KEYS.subscription, next) ? next : null
}

export function cancelSubscriptionIn(store: ActionStorage): boolean {
  return store.remove(STORE_KEYS.subscription)
}

export function addReviewIn(
  store: ActionStorage,
  bookId: number,
  input: UserReviewInput,
  now: Date,
  id: string
): UserReview | null {
  const review = createUserReview(bookId, input, now, id)
  const list = store.read<UserReview[]>(
    STORE_KEYS.reviews,
    [],
    isUserReviewList
  )
  return store.write(STORE_KEYS.reviews, addUserReview(list, review))
    ? review
    : null
}

/** true when the book's metadata is (or already was) stored. */
export function rememberForeignBookIn(
  store: ActionStorage,
  book: ForeignBook
): boolean {
  const current = store.read<Record<string, ForeignBook>>(
    STORE_KEYS.foreignBooks,
    {},
    isForeignBookRecord
  )
  const next = rememberForeignBook(current, book)
  return next === current || store.write(STORE_KEYS.foreignBooks, next)
}
