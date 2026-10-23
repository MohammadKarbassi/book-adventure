import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { BookJourneyScene } from "@/components/site/book-journey-scene"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type EmptyAction = { href: string; label: string }

export function LibraryEmpty({
  icon: Icon,
  title,
  description,
  primary,
  secondary,
}: {
  icon: LucideIcon
  title: string
  description: string
  primary: EmptyAction
  secondary?: EmptyAction
}) {
  return (
    <Empty className="border bg-card/60 py-16">
      <EmptyHeader>
        <EmptyMedia className="relative">
          <BookJourneyScene className="w-52" />
          {/* The tab's own icon as a small badge, so each empty state keeps
              its meaning next to the shared scene. */}
          <span className="absolute start-0 -bottom-1 flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground ring-4 ring-card">
            <Icon className="size-4" />
          </span>
        </EmptyMedia>
        <EmptyTitle className="text-2xl font-bold">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row flex-wrap justify-center">
        <Link href={primary.href} className={buttonVariants()}>
          {primary.label}
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className={buttonVariants({ variant: "outline" })}
          >
            {secondary.label}
          </Link>
        ) : null}
      </EmptyContent>
    </Empty>
  )
}
