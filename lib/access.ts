// Who can open a book: free books, purchased books, and subscription
// («in_plus») books while a subscription is active.

export type AccessBook = { free: boolean; inPlus: boolean }

export type AccessState = { purchased: boolean; subscriptionActive: boolean }

export type AccessReason = "free" | "purchased" | "subscription"

export function accessReason(
  book: AccessBook,
  { purchased, subscriptionActive }: AccessState
): AccessReason | null {
  if (book.free) return "free"
  if (purchased) return "purchased"
  if (book.inPlus && subscriptionActive) return "subscription"
  return null
}

export function canAccess(book: AccessBook, state: AccessState): boolean {
  return accessReason(book, state) !== null
}
