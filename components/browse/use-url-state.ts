"use client"

import { useOptimistic, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"

/**
 * URL-backed page state: the server renders from `searchParams`, and the
 * controls update the URL inside a transition. The optimistic copy keeps the
 * controls responsive while the server renders the new results.
 */
export function useUrlState<State>(
  state: State,
  serialize: (state: State) => string
) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(state)

  function navigate(
    next: State,
    { history = "replace", scroll = false }: NavigateOptions = {}
  ) {
    startTransition(() => {
      setOptimistic(next)
      const href = `${pathname}${serialize(next)}`
      if (history === "push") router.push(href, { scroll })
      else router.replace(href, { scroll })
    })
  }

  return { state: optimistic, isPending, navigate }
}

type NavigateOptions = {
  /** "push" adds a history entry (pagination); filters replace the current one. */
  history?: "push" | "replace"
  scroll?: boolean
}
