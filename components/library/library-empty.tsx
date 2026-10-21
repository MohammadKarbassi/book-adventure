import Link from "next/link"
import type { LucideIcon } from "lucide-react"

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
        <EmptyMedia
          variant="icon"
          className="size-14 rounded-s-md rounded-e-2xl bg-accent text-accent-foreground"
        >
          <Icon className="size-7" />
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
