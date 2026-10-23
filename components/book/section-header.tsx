import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { AccentText } from "@/components/site/accent-text"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SectionHeaderProps = {
  title: string
  /** A whole word (or words) of `title` shown in the accent color. */
  accent?: string
  description?: string
  /** Shows a «مشاهدهٔ همه» link at the inline end. */
  href?: string
  /** Extra controls at the inline end, e.g. carousel buttons. */
  action?: React.ReactNode
  /** Id for the heading, so a section can use aria-labelledby. */
  id?: string
  className?: string
}

export function SectionHeader({
  title,
  accent,
  description,
  href,
  action,
  id,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn("flex items-end justify-between gap-4", className)}
      data-slot="section-header"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2
          id={id}
          className="font-heading text-3xl leading-tight font-bold text-balance md:text-4xl"
        >
          <AccentText text={title} accent={accent} />
        </h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {href || action ? (
        <div className="flex shrink-0 items-center gap-2">
          {href ? (
            <Link
              href={href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              مشاهدهٔ همه
              <ArrowLeftIcon data-icon="inline-end" />
            </Link>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  )
}
