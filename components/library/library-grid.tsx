"use client"

import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { BookOpenIcon, HeadphonesIcon, HeartOffIcon } from "lucide-react"

import { BookCard } from "@/components/book/book-card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { BookSummary } from "@/lib/catalog"
import { formatDate } from "@/lib/format"

const gridClass =
  "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
const cardSizes = "(min-width: 1280px) 190px, (min-width: 768px) 22vw, 45vw"

export type LibraryItem = {
  book: BookSummary
  /** ISO date, purchased items only. */
  purchasedAt?: string
}

type LibraryGridProps = {
  label: string
  items: LibraryItem[]
  onRemove?: (book: BookSummary) => void
}

export function LibraryGrid({ label, items, onRemove }: LibraryGridProps) {
  const reduce = useReducedMotion()

  return (
    <ul aria-label={label} className={gridClass}>
      <AnimatePresence initial={false} mode="popLayout">
        {items.map(({ book, purchasedAt }, index) => (
          <motion.li
            key={book.id}
            layout={!reduce}
            exit={reduce ? undefined : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative flex flex-col gap-3"
          >
            <BookCard book={book} sizes={cardSizes} priority={index < 6} />
            {onRemove ? <RemoveButton book={book} onRemove={onRemove} /> : null}
            {purchasedAt ? (
              <PurchasedFooter book={book} purchasedAt={purchasedAt} />
            ) : null}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

function RemoveButton({
  book,
  onRemove,
}: {
  book: BookSummary
  onRemove: (book: BookSummary) => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`حذف ${book.title} از علاقه‌مندی‌ها`}
            onClick={() => onRemove(book)}
            className="absolute start-2 top-2 rounded-full bg-background/90 shadow-sm backdrop-blur-sm dark:bg-background/90"
          />
        }
      >
        <HeartOffIcon />
      </TooltipTrigger>
      <TooltipContent>حذف از علاقه‌مندی‌ها</TooltipContent>
    </Tooltip>
  )
}

function PurchasedFooter({
  book,
  purchasedAt,
}: {
  book: BookSummary
  purchasedAt: string
}) {
  const isAudio = book.type === "audiobook"
  const label = isAudio ? "گوش دادن" : "خواندن"
  return (
    <div className="mt-auto flex flex-col gap-2 px-0.5">
      <p className="text-xs text-muted-foreground">
        {`خریداری‌شده در ${formatDate(purchasedAt)}`}
      </p>
      <Link
        href={isAudio ? `/book/${book.id}` : `/read/${book.id}`}
        aria-label={`${label} ${book.title}`}
        className={buttonVariants({ size: "sm" })}
      >
        {isAudio ? (
          <HeadphonesIcon data-icon="inline-start" />
        ) : (
          <BookOpenIcon data-icon="inline-start" />
        )}
        {label}
      </Link>
    </div>
  )
}

export function LibraryGridSkeleton() {
  return (
    <div aria-hidden="true" className={gridClass}>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-2/3 w-full rounded-s-[3px] rounded-e-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
