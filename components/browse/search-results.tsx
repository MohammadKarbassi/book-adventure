"use client"

import { TypeToggleGroup } from "@/components/browse/type-toggle-group"
import { useUrlState } from "@/components/browse/use-url-state"
import { Spinner } from "@/components/ui/spinner"
import {
  serializeSearchParams,
  type SearchState,
  type TypeFilter,
} from "@/lib/browse"
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
        {children}
      </div>
    </div>
  )
}
