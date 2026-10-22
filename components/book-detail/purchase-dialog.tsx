"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { BookOpenIcon, ShieldCheckIcon } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { toast } from "sonner"

import { BookCover } from "@/components/book/book-cover"
import { PlayButton } from "@/components/player/play-button"
import type { Track } from "@/components/player/types"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { BookColor, BookSummary } from "@/lib/catalog"
import { formatNumber, formatPrice } from "@/lib/format"
import { usePurchases } from "@/lib/store"

import { discountAmount } from "./book-detail-utils"

export type PurchaseBook = Pick<
  BookSummary,
  "id" | "title" | "type" | "authors" | "finalPrice" | "price" | "discountPct"
> & {
  /** null for foreign books without a cover. */
  image: string | null
  color?: BookColor
}

type PurchaseDialogProps = {
  book: PurchaseBook
  track?: Track
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Where focus goes after closing (the buy button may be gone by then). */
  finalFocus?: () => HTMLElement | null
  /** Runs right after the purchase is stored. */
  onPurchased?: () => void
  /** Replaces the read/listen button on the success step. */
  successAction?: React.ReactNode
}

type Step = "confirm" | "paying" | "done"

// A short pause so the simulated payment feels like something happened.
const PAYMENT_DELAY = 700

export function PurchaseDialog({
  book,
  track,
  open,
  onOpenChange,
  finalFocus,
  onPurchased,
  successAction,
}: PurchaseDialogProps) {
  const { purchase } = usePurchases()
  const [step, setStep] = useState<Step>("confirm")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  function handleConfirm() {
    setStep("paying")
    timer.current = setTimeout(() => {
      purchase(book.id)
      onPurchased?.()
      setStep("done")
      toast.success("کتاب خریداری شد", {
        description: `«${book.title}» به کتابخانهٔ شما اضافه شد.`,
      })
    }, PAYMENT_DELAY)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Don't let the dialog close in the middle of a payment.
        if (!next && step === "paying") return
        onOpenChange(next)
      }}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setStep("confirm")
      }}
    >
      <DialogContent
        className="gap-5 sm:max-w-md"
        showCloseButton={step !== "paying"}
        finalFocus={finalFocus}
      >
        {step === "done" ? (
          <PurchaseSuccess
            book={book}
            track={track}
            action={successAction}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <PurchaseConfirm
            book={book}
            paying={step === "paying"}
            onConfirm={handleConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function PurchaseConfirm({
  book,
  paying,
  onConfirm,
}: {
  book: PurchaseBook
  paying: boolean
  onConfirm: () => void
}) {
  const discount = discountAmount(book)
  const typeLabel = book.type === "audiobook" ? "کتاب صوتی" : "کتاب الکترونیکی"

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold">خرید کتاب</DialogTitle>
        <DialogDescription>
          پس از خرید، کتاب برای همیشه در کتابخانهٔ شما می‌ماند.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-4 rounded-lg bg-muted/60 p-3">
        <BookCover book={book} size="sm" className="w-14" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="line-clamp-2 font-medium">{book.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {book.authors.join("، ")}
          </p>
          <Badge variant="outline" className="mt-0.5">
            {typeLabel}
          </Badge>
        </div>
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        {discount > 0 && book.price ? (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">قیمت</dt>
              <dd>{formatPrice(book.price)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {`تخفیف ${formatNumber(book.discountPct ?? 0)}٪`}
              </dt>
              <dd className="text-destructive">
                {`− ${formatPrice(discount)}`}
              </dd>
            </div>
            <Separator className="my-1" />
          </>
        ) : null}
        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-medium">مبلغ قابل پرداخت</dt>
          <dd className="text-lg font-bold">{formatPrice(book.finalPrice)}</dd>
        </div>
      </dl>

      <DialogFooter className="items-center sm:justify-between">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
          پرداخت آزمایشی، هزینه‌ای کسر نمی‌شود
        </p>
        <Button
          size="lg"
          className="w-full px-4 sm:w-auto"
          onClick={onConfirm}
          disabled={paying}
        >
          {paying ? (
            <Spinner data-icon="inline-start" aria-hidden="true" />
          ) : null}
          {paying ? "در حال پرداخت…" : "پرداخت و خرید"}
        </Button>
      </DialogFooter>
    </>
  )
}

function PurchaseSuccess({
  book,
  track,
  action,
  onClose,
}: {
  book: PurchaseBook
  track?: Track
  action?: React.ReactNode
  onClose: () => void
}) {
  return (
    <>
      <DialogHeader className="items-center pt-4 text-center">
        <SuccessCheck />
        <DialogTitle className="mt-2 text-2xl font-bold">
          کتاب خریداری شد
        </DialogTitle>
        <DialogDescription className="text-balance">
          {`«${book.title}» حالا در کتابخانهٔ شماست.`}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" size="lg" />}>
          بستن
        </DialogClose>
        {action ? (
          action
        ) : book.type === "audiobook" && track ? (
          // Start listening and get the dialog out of the way.
          <div className="contents" onClick={onClose}>
            <PlayButton track={track} label="گوش دادن" size="lg" />
          </div>
        ) : (
          <Link
            href={`/read/${book.id}`}
            className={buttonVariants({ size: "lg" })}
          >
            <BookOpenIcon data-icon="inline-start" />
            خواندن کتاب
          </Link>
        )}
      </DialogFooter>
    </>
  )
}

function SuccessCheck() {
  // Only rendered after a click, so reading the preference can't cause a
  // hydration mismatch.
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      aria-hidden="true"
      className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground"
      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.15, duration: 0.45, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  )
}
