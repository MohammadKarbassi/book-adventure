"use client"

import { useCallback, useSyncExternalStore } from "react"

/** `serverValue` is used on the server and during hydration. */
export function useMediaQuery(query: string, serverValue: boolean): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener("change", callback)
      return () => list.removeEventListener("change", callback)
    },
    [query]
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  )
}
