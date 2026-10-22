import { BookTravelLink } from "@/components/book/book-travel-link"
import { HeadphonesIcon } from "lucide-react"

import { BookCover } from "@/components/book/book-cover"
import { PriceTag } from "@/components/book/price-tag"
import { RatingStars } from "@/components/book/rating-stars"
import { Badge } from "@/components/ui/badge"
import type { BookSummary } from "@/lib/catalog"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

type BookCardProps = {
  book: BookSummary
  priority?: boolean
  /** `sizes` for the cover image; defaults to a ~6-per-row grid. */
  sizes?: string
  className?: string
}

const defaultSizes = "(min-width: 1280px) 200px, (min-width: 768px) 240px, 45vw"

// Server-renderable: no hooks, no server-only imports, serializable props.
export function BookCard({ book, priority, sizes, className }: BookCardProps) {
  const isAudio = book.type === "audiobook"
  const hasDiscount = !book.free && (book.discountPct ?? 0) > 0

  return (
    <BookTravelLink
      href={`/book/${book.id}`}
      className={cn(
        "group/book-card flex flex-col gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <div
        data-book-card-object=""
        className="relative origin-right transition-transform duration-300 ease-out group-hover/book-card:[transform:perspective(900px)_rotateY(-9deg)_translateY(-6px)] group-focus-visible/book-card:[transform:perspective(900px)_rotateY(-9deg)_translateY(-6px)] motion-reduce:group-hover/book-card:transform-none motion-reduce:group-focus-visible/book-card:transform-none motion-reduce:transform-none motion-reduce:transition-none"
      >
        <BookCover
          book={book}
          priority={priority}
          sizes={sizes ?? defaultSizes}
          className="w-full transition-shadow duration-300 group-hover/book-card:shadow-xl motion-reduce:transition-none"
        />
        <div className="absolute end-2 top-2 flex flex-col items-end gap-1">
          {hasDiscount ? (
            <Badge
              variant="destructive"
              className="bg-background/90 shadow-sm backdrop-blur-sm dark:bg-background/90"
            >
              {`${formatNumber(book.discountPct ?? 0)}٪`}
              <span className="sr-only"> تخفیف</span>
            </Badge>
          ) : null}
          {book.free ? <Badge className="shadow-sm">رایگان</Badge> : null}
        </div>
        {isAudio || book.inPlus ? (
          <div className="absolute end-2 bottom-2 flex flex-wrap justify-end gap-1">
            {isAudio ? (
              <Badge variant="secondary" className="shadow-sm">
                <HeadphonesIcon data-icon="inline-start" />
                صوتی
              </Badge>
            ) : null}
            {book.inPlus ? (
              <Badge variant="accent" className="shadow-sm">
                اشتراکی
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="line-clamp-1 text-sm font-medium group-hover/book-card:text-accent-foreground">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.authors.join("، ")}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <RatingStars rating={book.rating} />
          <PriceTag book={book} />
        </div>
      </div>
    </BookTravelLink>
  )
}
