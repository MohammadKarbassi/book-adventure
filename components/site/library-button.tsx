"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { LibraryBigIcon } from "lucide-react"
import { useAnimate, useReducedMotion } from "motion/react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useFavorites, useHydrated, usePurchases } from "@/lib/store"
import { formatNumber } from "@/lib/format"
import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

export function LibraryButton({ className }: { className?: string }) {
  const hydrated = useHydrated()
  const { favorites } = useFavorites()
  const { purchases } = usePurchases()
  // localStorage is unknown on the server: no badge until hydrated.
  const count = hydrated ? favorites.length + purchases.length : 0
  const [scope, animate] = useAnimate<HTMLSpanElement>()
  const reduceMotion = useReducedMotion()
  const prevCount = useRef<number | null>(null)

  // A book just joined the library: pulse the badge once and nudge the icon.
  // Skips the first hydrated value and decreases.
  useEffect(() => {
    if (!hydrated) return
    const prev = prevCount.current
    prevCount.current = count
    if (prev === null || count <= prev) return
    if (reduceMotion) {
      animate("[data-library-count]", { opacity: [0.5, 1] }, { duration: 0.32 })
      return
    }
    const pulse = { duration: 0.32, ease: EASE_OUT }
    animate("[data-library-count]", { scale: [1, 1.25, 1] }, pulse)
    animate("[data-library-icon]", { rotate: [-8, 0] }, pulse)
  }, [hydrated, count, reduceMotion, animate])

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
        <span ref={scope} className="contents">
          <LibraryBigIcon data-library-icon="" />
          {count > 0 ? (
            <Badge
              data-library-count=""
              aria-hidden="true"
              className="absolute -end-1 -top-1 h-4 min-w-4 px-1 text-[0.625rem] tabular-nums"
            >
              {formatNumber(count)}
            </Badge>
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">کتابخانهٔ من</TooltipContent>
    </Tooltip>
  )
}
