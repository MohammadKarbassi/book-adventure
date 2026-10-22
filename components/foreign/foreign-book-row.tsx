"use client"

import { SectionHeader } from "@/components/book/section-header"
import { ForeignBookCard } from "@/components/foreign/foreign-book-card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { ForeignBook } from "@/lib/foreign"
import { cn } from "@/lib/utils"

type ForeignBookRowProps = {
  books: ForeignBook[]
  title: string
  description?: string
  /** Heading id; the section links here from the shelf nav. */
  headingId: string
  priority?: boolean
  className?: string
}

/** BookRow for Open Library books: a draggable carousel of ForeignBookCards. */
export function ForeignBookRow({
  books,
  title,
  description,
  headingId,
  priority = false,
  className,
}: ForeignBookRowProps) {
  return (
    <Carousel
      opts={{
        direction: "rtl",
        align: "start",
        dragFree: true,
        containScroll: "trimSnaps",
      }}
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4", className)}
    >
      <SectionHeader
        id={headingId}
        title={title}
        description={description}
        action={
          <div className="hidden items-center gap-1.5 sm:flex">
            <CarouselPrevious
              aria-label="کتاب‌های قبلی"
              className="static my-0"
            />
            <CarouselNext aria-label="کتاب‌های بعدی" className="static my-0" />
          </div>
        }
      />
      <CarouselContent className="py-3">
        {books.map((book, index) => (
          <CarouselItem
            key={book.workId}
            className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6"
          >
            <ForeignBookCard book={book} priority={priority && index < 6} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
