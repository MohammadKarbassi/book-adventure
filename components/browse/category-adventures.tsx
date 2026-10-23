import Link from "next/link"

import { BookCover } from "@/components/book/book-cover"
import { SectionHeader } from "@/components/book/section-header"
import type { Adventure } from "@/lib/adventures"

/** «ماجراهای این قفسه»: the adventures whose book sits in this category. */
export function CategoryAdventures({
  adventures,
}: {
  adventures: Adventure[]
}) {
  if (adventures.length === 0) return null
  return (
    <section
      aria-labelledby="category-adventures"
      className="flex flex-col gap-6"
    >
      <SectionHeader
        id="category-adventures"
        title="ماجراهای این قفسه"
        accent="ماجراهای"
        description="کتاب‌های این قفسه که در مسیر ماجراجویی، سفری برایشان نوشته‌ایم"
      />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
        {adventures.map(({ book, copy }) => (
          <li key={book.id}>
            <Link
              href={`/adventures/${book.id}`}
              className="group flex h-full flex-col gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center"
            >
              <BookCover
                book={book}
                size="sm"
                sizes="64px"
                className="w-16 transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none"
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-heading text-xl leading-tight font-bold text-balance group-hover:text-accent-foreground">
                  {copy.name}
                </span>
                <span className="line-clamp-2 text-sm text-muted-foreground">
                  {copy.tagline}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
