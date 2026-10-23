"use client"

import Link from "next/link"
import { CrownIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { useHydrated, useSubscription } from "@/lib/store"

/** The library hero's action: the active plan, or a way to get one. */
export function LibrarySubscriptionLink() {
  const hydrated = useHydrated()
  const { subscription, isActive } = useSubscription()

  if (!hydrated) return <Skeleton className="h-7 w-44 rounded-full" />
  if (isActive && subscription) {
    return (
      <Badge
        variant="accent"
        className="h-7 px-3 text-sm"
        render={<Link href="/subscription" />}
      >
        <CrownIcon data-icon="inline-start" />
        {`اشتراک فعال تا ${formatDate(subscription.expiresAt)}`}
      </Badge>
    )
  }
  return (
    <Link
      href="/subscription"
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      <CrownIcon data-icon="inline-start" />
      اشتراک ندارید؟ مشاهدهٔ طرح‌ها
    </Link>
  )
}
