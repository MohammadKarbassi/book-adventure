import Link from "next/link"
import { SearchIcon } from "lucide-react"

import { getCategoryIcon } from "@/components/site/nav-config"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { serializeSearchParams } from "@/lib/browse"

type SearchSuggestionsProps = {
  authors: string[]
  categories: { slug: string; title: string }[]
}

/** Starting points shown before a search and when nothing is found. */
export function SearchSuggestions({
  authors,
  categories,
}: SearchSuggestionsProps) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <SuggestionGroup title="نویسنده‌های محبوب">
        {authors.map((author) => (
          <Link
            key={author}
            href={`/search${serializeSearchParams({ q: author })}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-full bg-card"
            )}
          >
            <SearchIcon
              data-icon="inline-start"
              className="text-muted-foreground"
            />
            {author}
          </Link>
        ))}
      </SuggestionGroup>
      <SuggestionGroup title="دسته‌بندی‌ها">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.slug)
          return (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full bg-card"
              )}
            >
              <Icon
                data-icon="inline-start"
                className="text-accent-foreground"
              />
              {category.title}
            </Link>
          )
        })}
      </SuggestionGroup>
    </div>
  )
}

function SuggestionGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="flex flex-wrap justify-center gap-2">{children}</div>
    </section>
  )
}
