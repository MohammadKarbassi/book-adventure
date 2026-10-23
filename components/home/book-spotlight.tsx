import Link from "next/link"
import { ArrowLeftIcon, SparklesIcon } from "lucide-react"

import { roomColors, roomGradient } from "@/components/adventures/room-colors"
import { BookCover3D } from "@/components/book-detail/book-cover-3d"
import { PriceTag } from "@/components/book/price-tag"
import { RatingStars } from "@/components/book/rating-stars"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import type { BookPalette } from "@/lib/adventures"
import type { BookSummary } from "@/lib/catalog"
import { cn } from "@/lib/utils"

type BookSpotlightProps = {
  book: BookSummary
  palette: BookPalette
  /** The opening paragraph of the book's description. */
  excerpt: string
  category?: { slug: string; title: string }
  eyebrow?: string
}

/**
 * One book in its own room, like a stop on the adventure journey: a full-bleed
 * band in the cover's palette with hard seams, its ink, and the 3D cover.
 */
export function BookSpotlight({
  book,
  palette,
  excerpt,
  category,
  eyebrow,
}: BookSpotlightProps) {
  const room = roomColors(palette)

  return (
    <section
      aria-labelledby="spotlight-heading"
      data-book-room={room.tone}
      className={cn(
        "relative mx-[calc(50%-50vw)] text-foreground",
        room.tone === "dark" && "dark"
      )}
      style={{
        ...(room.vars as React.CSSProperties),
        backgroundImage: roomGradient(room),
      }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16 md:py-20">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <div className="flex items-center gap-3 text-sm font-medium">
            {eyebrow ? (
              <>
                <span>{eyebrow}</span>
                <span aria-hidden="true" className="h-px w-8 bg-foreground/40" />
              </>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <SparklesIcon aria-hidden="true" className="size-4" />
              پیشنهاد ویژهٔ ما
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <h2
              id="spotlight-heading"
              className="font-heading text-5xl leading-tight font-bold text-balance md:text-7xl"
            >
              {book.title}
            </h2>
            <p className="text-base text-muted-foreground">
              {book.authors.join("، ")}
            </p>
          </div>
          <p className="line-clamp-4 max-w-prose font-heading text-2xl/relaxed text-pretty md:text-[1.75rem]/relaxed">
            {excerpt}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <RatingStars
              rating={book.rating}
              count={book.ratingsCount}
              variant="full"
            />
            {category ? (
              <Badge variant="outline" className="h-6 px-2.5">
                {category.title}
              </Badge>
            ) : null}
            <PriceTag book={book} className="text-base" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Link
              href={`/book/${book.id}`}
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
            >
              ورق زدن این کتاب
              <ArrowLeftIcon data-icon="inline-end" />
            </Link>
            {category ? (
              <Link
                href={`/category/${category.slug}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "h-11 px-4"
                )}
              >
                قفسهٔ {category.title}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex justify-center pb-6 md:pe-8">
          <BookCover3D book={book} />
        </div>
      </div>
    </section>
  )
}
