import Link from "next/link"

import { BookCover } from "@/components/book/book-cover"
import { PriceTag } from "@/components/book/price-tag"
import { RatingStars } from "@/components/book/rating-stars"
import { isLatin } from "@/components/book-detail/book-detail-utils"
import { Badge } from "@/components/ui/badge"
import { foreignBookHref, type ForeignBook } from "@/lib/foreign"
import { toPersianDigits } from "@/lib/format"
import { cn } from "@/lib/utils"

type ForeignBookCardProps = {
  book: ForeignBook
  priority?: boolean
  sizes?: string
  className?: string
}

const defaultSizes = "(min-width: 1280px) 200px, (min-width: 768px) 240px, 45vw"

/** "ltr" for Latin text, so punctuation and ellipses land on the right side. */
export function latinDir(text: string): "ltr" | undefined {
  return isLatin(text) ? "ltr" : undefined
}

// Latin lines get dir="ltr" but keep the card's (RTL) start alignment:
// match-parent resolves "start" against the parent's direction.
export const latinLineClass = "[text-align:match-parent]"

// Mirrors BookCard; server-renderable (no hooks, serializable props).
export function ForeignBookCard({
  book,
  priority,
  sizes,
  className,
}: ForeignBookCardProps) {
  const authors = book.authors.join(", ")

  return (
    <Link
      href={foreignBookHref(book.workId)}
      className={cn(
        "group/book-card flex flex-col gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <div className="relative transition-transform duration-300 ease-out group-hover/book-card:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover/book-card:translate-y-0">
        {/* English books bind on the left: flip the spine shading. */}
        <div dir="ltr">
          <BookCover
            book={{ title: book.title, image: book.cover }}
            priority={priority}
            sizes={sizes ?? defaultSizes}
            className="w-full transition-shadow duration-300 group-hover/book-card:shadow-xl motion-reduce:transition-none"
          />
        </div>
        <Badge
          variant="secondary"
          className="absolute end-2 bottom-2 shadow-sm"
        >
          انگلیسی
        </Badge>
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3
          dir={latinDir(book.title)}
          className={cn(
            "line-clamp-1 text-sm font-medium group-hover/book-card:text-accent-foreground",
            latinLineClass
          )}
        >
          {book.title}
        </h3>
        <p
          dir={latinDir(authors)}
          className={cn(
            "line-clamp-1 text-xs text-muted-foreground",
            latinLineClass
          )}
        >
          {authors || "نویسندهٔ نامشخص"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          {book.rating ? (
            <RatingStars rating={book.rating} />
          ) : book.year ? (
            <span className="text-xs text-muted-foreground">
              {toPersianDigits(book.year)}
            </span>
          ) : (
            <span />
          )}
          <PriceTag book={{ finalPrice: book.price, free: false }} />
        </div>
      </div>
    </Link>
  )
}
