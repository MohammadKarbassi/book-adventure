import Link from "next/link"

import { BrandMark } from "@/components/site/brand-mark"
import { cn } from "@/lib/utils"

/** The brand mark and name, without a link (e.g. for the footer). */
export function SiteBrand({ className }: { className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-2", className)}>
      <BrandMark className="drop-shadow-sm" />
      <span className="font-heading text-2xl leading-none font-bold whitespace-nowrap">
        ماجراجویی با کتاب
      </span>
    </span>
  )
}

/** Home link; its accessible name is exactly the site name. */
export function SiteLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "shrink-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <SiteBrand />
    </Link>
  )
}
