import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { SectionHeader } from "@/components/book/section-header"
import { getCategoryIcon, type NavCategory } from "@/components/site/nav-config"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { formatNumber } from "@/lib/format"

export function CategoryStrip({ categories }: { categories: NavCategory[] }) {
  return (
    <section
      aria-labelledby="categories-heading"
      className="flex flex-col gap-5"
    >
      <SectionHeader
        id="categories-heading"
        title="دسته‌بندی‌ها"
        description="از رمان فارسی تا فلسفه؛ قفسهٔ مورد علاقه‌تان را پیدا کنید"
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.slug)
          return (
            <li key={category.slug}>
              <Item
                variant="outline"
                className="h-full bg-card hover:border-accent-foreground/30 [a]:hover:bg-accent/40"
                render={<Link href={`/category/${category.slug}`} />}
              >
                <ItemMedia
                  variant="icon"
                  className="size-10 rounded-s-sm rounded-e-lg bg-accent text-accent-foreground"
                >
                  <Icon className="size-5" />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="line-clamp-1">
                    {category.title}
                  </ItemTitle>
                  <ItemDescription>
                    {formatNumber(category.count)} کتاب
                  </ItemDescription>
                </ItemContent>
                <ArrowLeftIcon
                  aria-hidden="true"
                  className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100 max-sm:hidden"
                />
              </Item>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
