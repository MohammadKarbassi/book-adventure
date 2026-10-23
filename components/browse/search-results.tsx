"use client"

import { useState } from "react"
import { motion } from "motion/react"

import { TypeToggleGroup } from "@/components/browse/type-toggle-group"
import { useUrlState } from "@/components/browse/use-url-state"
import { Spinner } from "@/components/ui/spinner"
import {
  serializeSearchParams,
  type SearchState,
  type TypeFilter,
} from "@/lib/browse"
import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

type SearchResultsProps = {
  state: SearchState
  /** Result counts per type, for the filter labels. */
  counts: Record<TypeFilter, number>
  /** Server-rendered result sections for the current filter. */
  children: React.ReactNode
}

/** Type filter that lives in the URL, plus a pending veil over the results. */
export function SearchResults({
  state: serverState,
  counts,
  children,
}: SearchResultsProps) {
  const { state, isPending, navigate } = useUrlState(
    serverState,
    serializeSearchParams
  )

  // Re-enter the results when a new server render settles (never while
  // pending); the first render is not animated.
  const settledKey = serializeSearchParams(serverState)
  const [firstKey] = useState(settledKey)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <TypeToggleGroup
          value={state.type}
          counts={counts}
          onValueChange={(type) => navigate({ ...state, type })}
        />
        {isPending ? <Spinner aria-label="در حال به‌روزرسانی" /> : null}
      </div>
      <div
        aria-busy={isPending}
        className={cn(
          "flex flex-col gap-14 transition-opacity duration-200 motion-reduce:transition-none",
          isPending && "opacity-60"
        )}
      >
        <motion.div
          key={settledKey}
          initial={settledKey === firstKey ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="flex flex-col gap-14"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
