"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { CrownIcon, LibraryBigIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import {
  PLUS_BOOKS_SECTION_ID,
  scrollToSection,
} from "@/components/subscription/scroll-to-section"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatDate, formatNumber, formatPrice } from "@/lib/format"
import { getPlan, type SubscriptionPlan } from "@/lib/plans"
import { useSubscription, type Subscription } from "@/lib/store"

export function ActivateDialog({ plan }: { plan: SubscriptionPlan }) {
  const { subscription, isActive, subscribe } = useSubscription()
  const [open, setOpen] = useState(false)
  const [activated, setActivated] = useState<Subscription | null>(null)

  const replacing =
    isActive && subscription ? getPlan(subscription.planId) : null

  function activate() {
    const next = subscribe(plan.id)
    setActivated(next)
    toast.success(`اشتراک ${plan.title} فعال شد`)
  }

  function showPlusBooks() {
    setOpen(false)
    // Let the dialog start closing so focus returns before scrolling.
    requestAnimationFrame(() => scrollToSection(PLUS_BOOKS_SECTION_ID))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) setActivated(null)
      }}
    >
      <DialogTrigger
        render={<Button size="lg" className="h-11 px-6 text-base" />}
      >
        <CrownIcon data-icon="inline-start" />
        فعال‌سازی اشتراک
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {activated ? (
          <ActivatedView
            plan={getPlan(activated.planId)}
            expiresAt={activated.expiresAt}
            onShowPlusBooks={showPlusBooks}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {`تأیید اشتراک ${plan.title}`}
              </DialogTitle>
              <DialogDescription>
                پرداخت آزمایشی، هزینه‌ای کسر نمی‌شود.
              </DialogDescription>
            </DialogHeader>
            <dl className="flex flex-col gap-3 rounded-lg bg-muted/60 p-4">
              <SummaryRow label="طرح" value={plan.title} />
              <SummaryRow
                label="مدت"
                value={`${formatNumber(plan.months)} ماه`}
              />
              <Separator />
              <SummaryRow
                label="مبلغ"
                value={formatPrice(plan.price)}
                emphasized
              />
            </dl>
            {replacing ? (
              <p className="text-sm text-muted-foreground">
                {`اشتراک ${replacing.title} فعلی شما با این طرح جایگزین می‌شود و اعتبار تازه از امروز حساب می‌شود.`}
              </p>
            ) : null}
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                انصراف
              </DialogClose>
              <Button onClick={activate}>تأیید و فعال‌سازی</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: string
  emphasized?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={emphasized ? "text-base font-bold" : "font-medium"}>
        {value}
      </dd>
    </div>
  )
}

function ActivatedView({
  plan,
  expiresAt,
  onShowPlusBooks,
}: {
  plan: SubscriptionPlan
  expiresAt: string
  onShowPlusBooks: () => void
}) {
  return (
    <>
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <AnimatedCheck />
        <DialogTitle className="text-3xl font-bold">
          اشتراک شما فعال شد
        </DialogTitle>
        <DialogDescription className="text-base">
          {`اشتراک ${plan.title} · معتبر تا ${formatDate(expiresAt)}`}
        </DialogDescription>
        <p className="text-sm text-muted-foreground">
          حالا همهٔ کتاب‌های «اشتراکی» بدون خرید برایتان باز می‌شوند.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onShowPlusBooks}>
          <SparklesIcon data-icon="inline-start" />
          دیدن کتاب‌های اشتراکی
        </Button>
        <Link href="/library" className={buttonVariants()}>
          <LibraryBigIcon data-icon="inline-start" />
          رفتن به کتابخانهٔ من
        </Link>
      </DialogFooter>
    </>
  )
}

function AnimatedCheck() {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-8"
      >
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.15, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  )
}
