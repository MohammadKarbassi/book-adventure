"use client"

import { useId } from "react"

import { BookCard } from "@/components/book/book-card"
import { SectionHeader } from "@/components/book/section-header"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { BookSummary } from "@/lib/catalog"
import { cn } from "@/lib/utils"

type BookRowProps = {
  books: BookSummary[]
  title: string
  description?: string
  /** «مشاهدهٔ همه» target. */
  href?: string
  /** Load the first covers eagerly (use for an above-the-fold row). */
  priority?: boolean
  className?: string
}

export function BookRow({
  books,
  title,
  description,
  href,
  priority = false,
  className,
}: BookRowProps) {
  const headingId = useId()

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
        href={href}
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
            key={book.id}
            className="basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6"
          >
            <BookCard book={book} priority={priority && index < 6} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
