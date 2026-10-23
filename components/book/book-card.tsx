import { BookTravelLink } from "@/components/book/book-travel-link"
import { HeadphonesIcon, RouteIcon } from "lucide-react"

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
  /** Stand the cover on a plank that runs on into neighbouring cards. The
   * container sets `--shelf-bleed` to half its column gap. */
  shelf?: boolean
  /** Editorial rank numeral beside the cover (top-10 rows). */
  rank?: number
  className?: string
}

const defaultSizes = "(min-width: 1280px) 200px, (min-width: 768px) 240px, 45vw"

// Server-renderable: no hooks, no server-only imports, serializable props.
export function BookCard({
  book,
  priority,
  sizes,
  shelf = false,
  rank,
  className,
}: BookCardProps) {
  const isAudio = book.type === "audiobook"
  const hasDiscount = !book.free && (book.discountPct ?? 0) > 0
  const ranked = rank !== undefined

  return (
    <BookTravelLink
      href={`/book/${book.id}`}
      className={cn(
        "group/book-card flex h-full flex-col gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        ranked && "ps-14",
        className
      )}
    >
      {ranked ? (
        <span className="sr-only">{`رتبهٔ ${formatNumber(rank)}`}</span>
      ) : null}
      {/* The numeral and plank sit outside the tilting object so they stay
          put on hover; both paint in DOM order around it. */}
      <div
        className={cn(
          "relative",
          // The plank also runs under the numeral's column.
          ranked &&
            "[--shelf-bleed-start:calc(var(--shelf-bleed,0.5rem)+3.5rem)]"
        )}
      >
        {ranked ? (
          <span
            aria-hidden="true"
            data-book-card-rank=""
            className={cn(
              "pointer-events-none absolute -start-14 translate-y-[0.12em] font-heading text-[7.5rem] leading-none font-bold text-[color-mix(in_oklch,var(--primary)_30%,transparent)] select-none [-webkit-text-stroke:2px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
              shelf ? "bottom-3" : "bottom-0"
            )}
          >
            {formatNumber(rank)}
          </span>
        ) : null}
        <div
          data-book-card-object=""
          className="relative origin-right transition-transform duration-300 ease-out group-hover/book-card:[transform:perspective(900px)_rotateY(-9deg)_translateY(-6px)] group-focus-visible/book-card:[transform:perspective(900px)_rotateY(-9deg)_translateY(-6px)] motion-reduce:transform-none motion-reduce:transition-none motion-reduce:group-hover/book-card:transform-none motion-reduce:group-focus-visible/book-card:transform-none"
        >
          <BookCover
            book={book}
            priority={priority}
            sizes={sizes ?? defaultSizes}
            className="w-full transition-shadow duration-300 group-hover/book-card:shadow-xl motion-reduce:transition-none"
          />
          {book.adventure ? (
            <Badge
              variant="outline"
              className="absolute start-2 top-2 bg-background/90 shadow-sm backdrop-blur-sm dark:bg-background/90"
            >
              <RouteIcon data-icon="inline-start" />
              ماجراجویی
            </Badge>
          ) : null}
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
        {shelf ? (
          <div
            aria-hidden="true"
            data-book-card-shelf=""
            className="relative ms-[calc(var(--shelf-bleed-start,var(--shelf-bleed,0.5rem))*-1)] me-[calc(var(--shelf-bleed-end,var(--shelf-bleed,0.5rem))*-1)] shadow-[0_8px_10px_-6px_color-mix(in_oklch,var(--foreground)_28%,transparent)]"
          >
            <div className="h-2 bg-[color-mix(in_oklch,var(--foreground)_10%,var(--background))]" />
            <div className="h-1 bg-[color-mix(in_oklch,var(--foreground)_20%,var(--background))]" />
            {/* Contact shadow where the cover meets the plank. */}
            <div className="absolute start-[calc(var(--shelf-bleed-start,var(--shelf-bleed,0.5rem))+6%)] end-[calc(var(--shelf-bleed-end,var(--shelf-bleed,0.5rem))+6%)] top-0 h-1.5 rounded-full bg-foreground/25 blur-[3px]" />
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-0.5">
        <h3 className="line-clamp-2 min-h-10 text-sm leading-5 font-medium group-hover/book-card:text-accent-foreground group-focus-visible/book-card:text-accent-foreground">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {book.authors.join("، ")}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1.5">
          <RatingStars rating={book.rating} />
          <PriceTag book={book} />
        </div>
      </div>
    </BookTravelLink>
  )
}
