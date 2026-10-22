"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"

import {
  orderJourney,
  startedBookIds,
  type CategoryMap,
  type JourneyOrder,
} from "@/components/adventures/journey-order"
import { STORE_KEYS, isNumberRecord } from "@/lib/store-core"
import { storage } from "@/lib/storage"
import { useFavorites, usePurchases } from "@/lib/store"

const NO_RECORD: Record<string, number> = {}

/** A stored number record (progress), empty on the server and in hydration. */
function useNumberRecord(name: string): Record<string, number> {
  const subscribe = useCallback(
    (callback: () => void) => storage.subscribe(name, callback),
    [name]
  )
  return useSyncExternalStore(
    subscribe,
    () => storage.read(name, NO_RECORD, isNumberRecord),
    () => NO_RECORD
  )
}

/**
 * The adventures in the order for this reader. The server and the hydration
 * render use the default order; stored interests reorder it right after.
 */
export function useJourneyOrder<T extends { categorySlug: string }>(
  items: T[],
  categoryOf: CategoryMap
): JourneyOrder<T> {
  const { favorites } = useFavorites()
  const { purchases } = usePurchases()
  const readerProgress = useNumberRecord(STORE_KEYS.readerProgress)
  const audioProgress = useNumberRecord(STORE_KEYS.audioProgress)

  return useMemo(
    () =>
      orderJourney(
        items,
        {
          favorites,
          purchases: purchases.map((purchase) => purchase.bookId),
          started: startedBookIds(readerProgress, audioProgress),
        },
        categoryOf
      ),
    [items, categoryOf, favorites, purchases, readerProgress, audioProgress]
  )
}
