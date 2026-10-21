import type { BookSummary } from "@/lib/catalog"
import { formatNumber, formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

type PriceTagProps = {
  book: Pick<BookSummary, "finalPrice" | "price" | "discountPct" | "free">
  className?: string
}

export function PriceTag({ book, className }: PriceTagProps) {
  if (book.free || book.finalPrice === 0) {
    return (
      <span
        className={cn("text-sm font-bold text-accent-foreground", className)}
      >
        رایگان
      </span>
    )
  }

  const original =
    book.price && book.price > book.finalPrice ? book.price : undefined

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-1.5 text-sm",
        className
      )}
    >
      <span className="font-bold">{formatPrice(book.finalPrice)}</span>
      {original ? (
        <del className="text-xs text-muted-foreground">
          <span className="sr-only">قیمت قبلی: </span>
          {formatNumber(original)}
        </del>
      ) : null}
    </span>
  )
}
