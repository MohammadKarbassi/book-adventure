"use client"

import { useId } from "react"
import { MotionConfig, motion, type Variants } from "motion/react"

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
import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

type BookRowProps = {
  books: BookSummary[]
  title: string
  /** Chapter label above the title, e.g. «فصل ۲». */
  eyebrow?: string
  description?: string
  /** «مشاهدهٔ همه» target. */
  href?: string
  /** Show an editorial rank numeral beside each cover (top-10 rows). */
  ranked?: boolean
  /** Load the first covers eagerly (use for an above-the-fold row). */
  priority?: boolean
  className?: string
}

/** Only the first screenful of cards staggers in; the rest are already there. */
const STAGGERED = 6

const entrance: Variants = {
  hidden: { opacity: 0, y: 12 },
  shown: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT, delay: index * 0.05 },
  }),
}

export function BookRow({
  books,
  title,
  eyebrow,
  description,
  href,
  ranked = false,
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
      className={className}
    >
      {/* "user": with prefers-reduced-motion only the fade remains. The header
          and the first cards share one in-view trigger, in reading order. */}
      <MotionConfig reducedMotion="user">
        <motion.div
          initial="hidden"
          whileInView="shown"
          viewport={{ once: true, margin: "0px 0px -12% 0px" }}
          className="flex flex-col gap-4"
        >
          <motion.div variants={entrance} custom={0}>
            <SectionHeader
              id={headingId}
              eyebrow={eyebrow}
              title={title}
              description={description}
              href={href}
              action={
                <div className="hidden items-center gap-1.5 sm:flex">
                  <CarouselPrevious
                    aria-label="کتاب‌های قبلی"
                    className="static my-0"
                  />
                  <CarouselNext
                    aria-label="کتاب‌های بعدی"
                    className="static my-0"
                  />
                </div>
              }
            />
          </motion.div>
          {/* Items are spaced by a 1rem padding-start, so each plank bleeds
              half of it on both sides to meet its neighbours. */}
          <CarouselContent className="py-3 [--shelf-bleed:0.5rem]">
            {books.map((book, index) => {
              const card = (
                <BookCard
                  book={book}
                  priority={priority && index < 6}
                  rank={ranked ? index + 1 : undefined}
                  shelf
                />
              )
              return (
                <CarouselItem
                  key={book.id}
                  className={cn(
                    ranked
                      ? "basis-[62%] sm:basis-[45%] md:basis-[36%] lg:basis-[28%] xl:basis-1/5"
                      : "basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/6"
                  )}
                >
                  {index < STAGGERED ? (
                    <motion.div
                      variants={entrance}
                      custom={index + 1}
                      className="h-full"
                    >
                      {card}
                    </motion.div>
                  ) : (
                    card
                  )}
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </motion.div>
      </MotionConfig>
    </Carousel>
  )
}
