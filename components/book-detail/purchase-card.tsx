"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  BookOpenIcon,
  BookOpenTextIcon,
  CheckIcon,
  HeadphonesIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
} from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { PriceTag } from "@/components/book/price-tag"
import { PlayButton } from "@/components/player/play-button"
import type { Track } from "@/components/player/types"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber, formatPrice } from "@/lib/format"
import { DURATION, EASE_OUT } from "@/lib/motion"
import { useBookAccess } from "@/lib/store"
import { cn } from "@/lib/utils"

import { FavoriteButton } from "./favorite-button"
import { PurchaseDialog, type PurchaseBook } from "./purchase-dialog"
import { ShareButton } from "./share-button"

export type PurchaseCardBook = PurchaseBook & {
  free: boolean
  inPlus: boolean
  printedPrice?: number
}

export type SampleCredit = {
  license: string
  licenseUrl: string
  sourceUrl: string
}

type PurchaseCardProps = {
  book: PurchaseCardBook
  /** Audiobooks only: the sample track for the player. */
  track?: Track
  sampleCredit?: SampleCredit
  className?: string
}

// Rows wrap their price/action under the text on narrow screens.
const rowClass = "rounded-none gap-x-3 gap-y-2 px-5 py-4"
const actionClass = "h-10 px-4"

// The primary action swaps after a purchase or subscription: a soft
// scale-and-focus in, a quick fade out. Reduced motion keeps the fade only.
const swapMotion = {
  initial: { opacity: 0, scale: 0.96, filter: "blur(2px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    scale: 0.96,
    filter: "blur(2px)",
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
  transition: { duration: DURATION.base, ease: EASE_OUT },
}
const swapMotionReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
  transition: { duration: DURATION.base },
}

export function PurchaseCard({
  book,
  track,
  sampleCredit,
  className,
}: PurchaseCardProps) {
  const { hydrated, purchased, viaSubscription, canRead } = useBookAccess(book)
  const [dialogOpen, setDialogOpen] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const swap = reduceMotion ? swapMotionReduced : swapMotion
  const isAudio = book.type === "audiobook"
  const hasDiscount = !book.free && (book.discountPct ?? 0) > 0
  const price = (
    <>
      {hasDiscount ? (
        <Badge variant="destructive">
          {`${formatNumber(book.discountPct ?? 0)}٪ تخفیف`}
        </Badge>
      ) : null}
      <PriceTag book={book} className="text-lg" />
    </>
  )

  return (
    <Card className={cn("gap-0 py-0", className)}>
      <ItemGroup className="gap-0">
        <Item role="listitem" className={rowClass}>
          <ItemMedia variant="icon" className="text-muted-foreground">
            {isAudio ? <HeadphonesIcon /> : <BookOpenTextIcon />}
          </ItemMedia>
          <ItemContent className="min-w-52">
            <ItemTitle>{isAudio ? "نسخهٔ صوتی" : "نسخهٔ الکترونیکی"}</ItemTitle>
            <ItemDescription className="line-clamp-none">
              {book.free
                ? "رایگان و همیشه در دسترس"
                : "یک بار بخرید، همیشه در کتابخانهٔ شما"}
            </ItemDescription>
          </ItemContent>
          <ItemActions className="ms-auto gap-2.5">
            {!hydrated ? (
              price
            ) : (
              // Mounted only once hydrated, so the first real value appears
              // as is; later changes (a purchase) animate.
              <AnimatePresence mode="popLayout" initial={false}>
                {purchased ? (
                  <motion.span
                    key="owned"
                    className="inline-flex"
                    initial={
                      reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: DURATION.base,
                      ease: EASE_OUT,
                      delay: 0.08,
                    }}
                  >
                    <Badge variant="accent" className="h-6 px-2.5">
                      <CheckIcon data-icon="inline-start" />
                      خریداری‌شده
                    </Badge>
                  </motion.span>
                ) : (
                  <motion.span
                    key="price"
                    className="flex items-center gap-2.5"
                    exit={{
                      opacity: 0,
                      transition: { duration: DURATION.fast },
                    }}
                  >
                    {price}
                  </motion.span>
                )}
              </AnimatePresence>
            )}
          </ItemActions>
        </Item>

        {book.printedPrice ? (
          <>
            <ItemSeparator className="my-0" />
            <Item role="listitem" size="sm" className={rowClass}>
              <ItemMedia variant="icon" className="text-muted-foreground">
                <TagIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="font-normal text-muted-foreground">
                  قیمت نسخهٔ چاپی
                </ItemTitle>
              </ItemContent>
              <ItemActions className="text-sm text-muted-foreground">
                {formatPrice(book.printedPrice)}
              </ItemActions>
            </Item>
          </>
        ) : null}

        {book.inPlus && !book.free ? (
          <>
            <ItemSeparator className="my-0" />
            <Item role="listitem" className={rowClass}>
              <ItemMedia variant="icon" className="text-accent-foreground">
                <SparklesIcon />
              </ItemMedia>
              <ItemContent className="min-w-52">
                <ItemTitle>این کتاب در اشتراک ماجراجویی است</ItemTitle>
                <ItemDescription className="line-clamp-none">
                  {hydrated && viaSubscription
                    ? "با اشتراک فعال شما، بدون پرداخت جداگانه در دسترس است."
                    : "با اشتراک، این کتاب و صدها کتاب دیگر را بی‌هزینهٔ اضافه داشته باشید."}
                </ItemDescription>
              </ItemContent>
              <ItemActions className="ms-auto">
                {hydrated && viaSubscription ? (
                  <Badge variant="accent" className="h-6 px-2.5">
                    <CheckIcon data-icon="inline-start" />
                    با اشتراک شما
                  </Badge>
                ) : (
                  <Link
                    href="/subscription"
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "px-0 text-accent-foreground"
                    )}
                  >
                    مشاهدهٔ اشتراک
                  </Link>
                )}
              </ItemActions>
            </Item>
          </>
        ) : null}
      </ItemGroup>

      <CardFooter className="flex-col items-stretch gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <div ref={actionsRef} className="contents">
            {!hydrated ? (
              // Purchases live in localStorage: don't guess before hydration.
              <Skeleton
                aria-hidden="true"
                className={cn(actionClass, "w-36 rounded-lg")}
              />
            ) : (
              // Mounted only once hydrated (initial={false}), so the swap from
              // the skeleton doesn't animate; a purchase or subscription does.
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={canRead ? (isAudio && track ? "listen" : "read") : "buy"}
                  className="inline-flex"
                  initial={swap.initial}
                  animate={swap.animate}
                  exit={swap.exit}
                  transition={swap.transition}
                >
                  {canRead ? (
                    isAudio && track ? (
                      <PlayButton
                        track={track}
                        label="گوش دادن"
                        size="lg"
                        className={actionClass}
                      />
                    ) : (
                      <Link
                        href={`/read/${book.id}`}
                        className={cn(
                          buttonVariants({ size: "lg" }),
                          actionClass
                        )}
                      >
                        <BookOpenIcon data-icon="inline-start" />
                        خواندن کتاب
                      </Link>
                    )
                  ) : (
                    <Button
                      size="lg"
                      className={actionClass}
                      onClick={() => setDialogOpen(true)}
                    >
                      <ShoppingBagIcon data-icon="inline-start" />
                      خرید کتاب
                    </Button>
                  )}
                </motion.span>
              </AnimatePresence>
            )}
          </div>

          {isAudio ? (
            track ? (
              <PlayButton
                track={track}
                label="شنیدن نمونهٔ رایگان"
                variant="outline"
                size="lg"
                className={actionClass}
              />
            ) : null
          ) : (
            <Link
              href={`/read/${book.id}?sample=1`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                actionClass
              )}
            >
              خواندن نمونه
            </Link>
          )}

          <div className="ms-auto flex items-center gap-2">
            <FavoriteButton bookId={book.id} title={book.title} />
            <ShareButton />
          </div>
        </div>

        {isAudio && sampleCredit ? (
          <p className="text-xs text-muted-foreground">
            نمونهٔ صوتی آزاد از{" "}
            <a
              href={sampleCredit.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Internet Archive
            </a>
            {" · "}
            <a
              href={sampleCredit.licenseUrl}
              target="_blank"
              rel="noreferrer license"
              dir="ltr"
              className="underline underline-offset-4 hover:text-foreground"
            >
              {sampleCredit.license}
            </a>
          </p>
        ) : null}
      </CardFooter>

      <PurchaseDialog
        book={book}
        track={track}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        finalFocus={() =>
          actionsRef.current?.querySelector<HTMLElement>("a, button") ?? null
        }
      />
    </Card>
  )
}
