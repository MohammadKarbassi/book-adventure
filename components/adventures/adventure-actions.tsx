"use client"

import Link from "next/link"
import { ArrowUpLeftIcon, HeadphonesIcon } from "lucide-react"

import type { AdventureView } from "@/components/adventures/adventure-types"
import { FavoriteButton } from "@/components/book-detail/favorite-button"
import { ShareButton } from "@/components/book-detail/share-button"
import { PriceTag } from "@/components/book/price-tag"
import { PlayButton } from "@/components/player/play-button"
import { useBookAccess } from "@/lib/store"
import { cn } from "@/lib/utils"

const rowClass = "flex min-h-13 items-stretch"
const mainClass =
  "flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-start text-[0.95rem] font-medium"
const endCellClass =
  "flex w-12 shrink-0 items-center justify-center border-s border-foreground/20"

/** A row that is one link, with the narrow ↗ cell at its end (like a ledger). */
function LinkRow({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          rowClass,
          "group/row transition-colors outline-none hover:bg-foreground/[0.06] focus-visible:bg-foreground/[0.06] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
        )}
      >
        <span className={mainClass}>{children}</span>
        <span className={endCellClass}>
          <ArrowUpLeftIcon
            aria-hidden="true"
            className="size-4 transition-transform duration-200 group-hover/row:-translate-x-0.5 group-hover/row:-translate-y-0.5 motion-reduce:transition-none"
          />
        </span>
      </Link>
    </li>
  )
}

/**
 * Stripe-Press-like purchase table: buy (or read, once owned), try a sample,
 * save or share. Rows are separated by hairlines in the ink color.
 */
export function AdventureActions({ adventure }: { adventure: AdventureView }) {
  const { book, track } = adventure
  const { purchased, viaSubscription, canRead } = useBookAccess(book)
  const isAudio = book.type === "audiobook"
  const owned = purchased
    ? "خریداری شده"
    : book.free
      ? "رایگان"
      : viaSubscription
        ? "با اشتراک شما"
        : ""

  return (
    <ul
      aria-label="خرید و دسترسی"
      className="divide-y divide-foreground/20 overflow-hidden rounded-sm border border-foreground/25 bg-background/25"
    >
      {canRead && isAudio && track ? (
        <li className={rowClass}>
          <PlayButton
            track={track}
            label={`${owned} · گوش دادن`}
            variant="ghost"
            className={cn(mainClass, "h-auto justify-start rounded-none")}
          />
          <span className={endCellClass}>
            <HeadphonesIcon aria-hidden="true" className="size-4" />
          </span>
        </li>
      ) : canRead ? (
        <LinkRow href={`/read/${book.id}`}>{`${owned} · خواندن`}</LinkRow>
      ) : (
        <LinkRow href={`/book/${book.id}`}>
          <span>مشاهدهٔ کتاب و خرید</span>
          <PriceTag book={book} className="text-foreground/80" />
        </LinkRow>
      )}

      {canRead ? (
        <LinkRow href={`/book/${book.id}`}>صفحهٔ کتاب و جزئیات</LinkRow>
      ) : isAudio && track ? (
        <li className={rowClass}>
          <PlayButton
            track={track}
            label="شنیدن نمونه"
            variant="ghost"
            className={cn(mainClass, "h-auto justify-start rounded-none")}
          />
          <span className={endCellClass}>
            <HeadphonesIcon aria-hidden="true" className="size-4" />
          </span>
        </li>
      ) : (
        <LinkRow href={`/read/${book.id}?sample=1`}>خواندن نمونه</LinkRow>
      )}

      <li className={cn(rowClass, "items-center")}>
        <span className={cn(mainClass, "text-muted-foreground")}>
          برای بعد نگهش دارید
        </span>
        <span className="flex items-center gap-2 px-2 py-1.5">
          <FavoriteButton
            bookId={book.id}
            title={book.title}
            className="border-foreground/20 bg-transparent"
          />
          <ShareButton className="border-foreground/20 bg-transparent" />
        </span>
      </li>
    </ul>
  )
}
