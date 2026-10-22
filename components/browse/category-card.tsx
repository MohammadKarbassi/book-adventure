import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { CategoryIcon } from "@/components/browse/category-icon"
import { CoverFan } from "@/components/browse/cover-fan"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { BookSummary } from "@/lib/catalog"
import { formatNumber } from "@/lib/format"

type CategoryCardProps = {
  slug: string
  title: string
  bookCount: number
  audioCount: number
  covers: BookSummary[]
  priority?: boolean
}

/** A category shelf: its most read covers fanned above the title. */
export function CategoryCard({
  slug,
  title,
  bookCount,
  audioCount,
  covers,
  priority,
}: CategoryCardProps) {
  const tint = covers[0]?.color.dominant

  return (
    <Link
      href={`/category/${slug}`}
      className="group/fan block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-0 pt-0 transition-shadow duration-300 group-hover/fan:shadow-lg group-hover/fan:ring-foreground/20 motion-reduce:transition-none">
        <div
          className="relative overflow-hidden bg-muted px-8 pt-8"
          style={
            tint
              ? {
                  backgroundImage: `linear-gradient(to bottom, color-mix(in oklch, ${tint} 22%, transparent), transparent)`,
                }
              : undefined
          }
        >
          <CoverFan
            books={covers}
            priority={priority}
            className="mx-auto w-56 translate-y-3"
          />
        </div>
        <CardHeader className="border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-s-sm rounded-e-xl bg-accent text-accent-foreground">
              <CategoryIcon slug={slug} className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <CardTitle className="text-2xl leading-tight font-bold group-hover/fan:text-accent-foreground">
                {title}
              </CardTitle>
              <CardDescription>
                {formatNumber(bookCount)} کتاب
                {audioCount > 0 ? ` · ${formatNumber(audioCount)} صوتی` : null}
              </CardDescription>
            </div>
            <ArrowLeftIcon
              aria-hidden="true"
              className="ms-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover/fan:-translate-x-1 group-hover/fan:text-accent-foreground motion-reduce:transition-none ltr:rotate-180"
            />
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
