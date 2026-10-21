"use client"

import Link from "next/link"
import { LibraryBigIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFavorites, useHydrated, usePurchases } from "@/lib/store"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function LibraryButton({ className }: { className?: string }) {
  const hydrated = useHydrated()
  const { favorites } = useFavorites()
  const { purchases } = usePurchases()
  // localStorage is unknown on the server: no badge until hydrated.
  const count = hydrated ? favorites.length + purchases.length : 0

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href="/library"
            aria-label="کتابخانهٔ من"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "relative",
              className
            )}
          />
        }
      >
        <LibraryBigIcon />
        {count > 0 ? (
          <Badge
            aria-hidden="true"
            className="absolute -end-1 -top-1 h-4 min-w-4 px-1 text-[0.625rem] tabular-nums"
          >
            {formatNumber(count)}
          </Badge>
        ) : null}
      </TooltipTrigger>
      <TooltipContent side="bottom">کتابخانهٔ من</TooltipContent>
    </Tooltip>
  )
}
