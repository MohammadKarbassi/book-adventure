import { BookCover } from "@/components/book/book-cover"
import type { BookColor, BookSummary } from "@/lib/catalog"
import { cn } from "@/lib/utils"

type CoverFanProps = {
  /** Up to three books; the first one sits in front, in the middle. */
  books: (Pick<BookSummary, "id" | "title"> & {
    image: string | null
    color?: BookColor
  })[]
  /** Fan out further while this group is hovered (set `group/fan` on it). */
  className?: string
  priority?: boolean
}

// Decorative: the visible text around the fan already names the shelf.
const placements = [
  "z-20 motion-safe:group-hover/fan:-translate-y-2",
  "z-10 -translate-x-[45%] rotate-[-9deg] motion-safe:group-hover/fan:-translate-x-[58%] motion-safe:group-hover/fan:rotate-[-13deg]",
  "z-0 translate-x-[45%] rotate-[9deg] motion-safe:group-hover/fan:translate-x-[58%] motion-safe:group-hover/fan:rotate-[13deg]",
]

/** Three covers fanned like books spread on a table. */
export function CoverFan({ books, className, priority }: CoverFanProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative flex items-end justify-center", className)}
    >
      {books.slice(0, 3).map((book, index) => (
        <BookCover
          key={book.id}
          book={{ ...book, title: "" }}
          priority={priority}
          sizes="112px"
          className={cn(
            "w-[32%] origin-bottom transition-transform duration-500 ease-out motion-reduce:transition-none",
            index > 0 && "absolute bottom-0",
            placements[index]
          )}
        />
      ))}
    </div>
  )
}
