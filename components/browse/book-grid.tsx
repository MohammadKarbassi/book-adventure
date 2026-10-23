import { BookCard } from "@/components/book/book-card"
import type { BookSummary } from "@/lib/catalog"
import { cn } from "@/lib/utils"

type BookGridProps = {
  books: BookSummary[]
  /** Number of leading covers to load eagerly. */
  priorityCount?: number
  className?: string
}

const gridSizes =
  "(min-width: 1280px) 190px, (min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw"

/** Responsive shelf of book cards: 2 / 3 / 4 / 6 columns. */
export function BookGrid({
  books,
  priorityCount = 0,
  className,
}: BookGridProps) {
  return (
    // Each plank bleeds half the 1rem column gap so a grid row reads as one
    // shelf; the outer ends stay inside the Container's side padding.
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 [--shelf-bleed:0.5rem] md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
        className
      )}
    >
      {books.map((book, index) => (
        <li key={book.id}>
          <BookCard
            book={book}
            priority={index < priorityCount}
            sizes={gridSizes}
            shelf
          />
        </li>
      ))}
    </ul>
  )
}
