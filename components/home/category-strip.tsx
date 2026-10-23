import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { SectionHeader } from "@/components/book/section-header"
import { CoverFan } from "@/components/browse/cover-fan"
import { getCategoryIcon, type NavCategory } from "@/components/site/nav-config"
import type { BookSummary } from "@/lib/catalog"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { formatNumber } from "@/lib/format"

export function CategoryStrip({
  categories,
  eyebrow,
}: {
  categories: (NavCategory & { covers: BookSummary[] })[]
  /** Chapter label for the section header. */
  eyebrow?: string
}) {
  return (
    <section
      aria-labelledby="categories-heading"
      className="flex flex-col gap-5"
    >
      <SectionHeader
        id="categories-heading"
        eyebrow={eyebrow}
        title="دسته‌بندی‌ها"
        description="از رمان فارسی تا فلسفه؛ قفسهٔ مورد علاقه‌تان را پیدا کنید"
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.slug)
          const tint = category.covers[0]?.color.dominant
          return (
            <li key={category.slug}>
              {/* A shelf label with its three most read covers peeking up
                  from the inline-end edge, washed in the front cover's color. */}
              <Item
                variant="outline"
                className="group/fan relative isolate h-full min-h-36 flex-nowrap items-start overflow-hidden bg-card bg-linear-to-t from-(--tint) to-transparent to-80% pe-40 hover:border-accent-foreground/30 [a]:hover:bg-accent/40 max-sm:pe-4 max-sm:pb-24"
                style={
                  {
                    "--tint": tint
                      ? `color-mix(in oklch, ${tint} 18%, transparent)`
                      : "transparent",
                  } as React.CSSProperties
                }
                render={<Link href={`/category/${category.slug}`} />}
              >
                <ItemContent className="min-w-0 gap-1">
                  <ItemTitle className="line-clamp-2 font-heading text-xl leading-tight font-bold group-hover/item:text-accent-foreground">
                    <Icon
                      aria-hidden="true"
                      className="me-1.5 inline size-4 align-[-0.1em] text-accent-foreground"
                    />
                    {category.title}
                  </ItemTitle>
                  <ItemDescription className="flex items-center gap-1.5">
                    {formatNumber(category.count)} کتاب
                    <ArrowLeftIcon
                      aria-hidden="true"
                      className="size-3.5 opacity-0 transition-[opacity,translate] group-hover/item:-translate-x-0.5 group-hover/item:opacity-100 group-focus-visible/item:opacity-100 motion-reduce:transition-none max-sm:hidden"
                    />
                  </ItemDescription>
                </ItemContent>
                <CoverFan
                  books={category.covers}
                  className="pointer-events-none absolute end-4 -bottom-8 -z-10 w-36 max-sm:inset-x-0 max-sm:mx-auto max-sm:w-32"
                />
              </Item>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
