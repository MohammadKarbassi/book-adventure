"use client"

import { useState, useSyncExternalStore } from "react"
import { motion, useReducedMotion } from "motion/react"
import { CrownIcon, RefreshCwIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { toastSaveError } from "@/components/site/save-error"
import {
  remainingDays,
  remainingPercent,
} from "@/components/subscription/plan-pricing"
import {
  PLANS_SECTION_ID,
  scrollToSection,
} from "@/components/subscription/scroll-to-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { formatDate, formatNumber } from "@/lib/format"
import { getPlan } from "@/lib/plans"
import { useHydrated, useSubscription } from "@/lib/store"

// Current time to the minute; 0 on the server (the card only renders after hydration).
const MINUTE = 60_000
const getNow = () => Math.floor(Date.now() / MINUTE) * MINUTE
function subscribeNow(callback: () => void) {
  const timer = setInterval(callback, MINUTE)
  return () => clearInterval(timer)
}

/** Shown only after hydration and only while a subscription is active. */
export function SubscriptionStatus() {
  const hydrated = useHydrated()
  const { subscription, isActive, cancel } = useSubscription()
  const now = useSyncExternalStore(subscribeNow, getNow, () => 0)
  const reduce = useReducedMotion()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!hydrated || !isActive || !subscription) return null

  const plan = getPlan(subscription.planId)
  const days = remainingDays(subscription, now)
  const percent = remainingPercent(subscription, now)

  function handleCancel() {
    if (!cancel()) {
      toastSaveError("اشتراک لغو نشد")
      return
    }
    setConfirmOpen(false)
    toast("اشتراک شما لغو شد", {
      description: "کتاب‌های خریده‌شده همچنان در کتابخانهٔ شما می‌مانند.",
    })
  }

  return (
    <motion.section
      aria-label="وضعیت اشتراک"
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="gap-5 py-6">
        <CardHeader className="px-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <CrownIcon aria-hidden="true" className="size-5" />
            </span>
            {`اشتراک ${plan.title}`}
          </CardTitle>
          <CardDescription>
            {`فعال تا ${formatDate(subscription.expiresAt)}`}
          </CardDescription>
          <CardAction>
            <Badge variant="accent">فعال</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="px-6">
          <Progress
            value={percent}
            getAriaValueText={() => `${formatNumber(days)} روز باقی مانده`}
          >
            <ProgressLabel>اعتبار باقی‌مانده</ProgressLabel>
            <ProgressValue>{() => `${formatNumber(days)} روز`}</ProgressValue>
          </Progress>
        </CardContent>
        <CardFooter className="flex-wrap gap-2 px-6">
          <Button
            variant="outline"
            onClick={() => scrollToSection(PLANS_SECTION_ID)}
          >
            <RefreshCwIcon data-icon="inline-start" />
            تغییر طرح
          </Button>
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger render={<Button variant="ghost" />}>
              <XIcon data-icon="inline-start" />
              لغو اشتراک
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  اشتراک لغو شود؟
                </DialogTitle>
                <DialogDescription>
                  با لغو اشتراک، کتاب‌های اشتراکی دیگر بدون خرید باز نمی‌شوند.
                  کتاب‌هایی که خریده‌اید سر جایشان می‌مانند.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  منصرف شدم
                </DialogClose>
                <Button variant="destructive" onClick={handleCancel}>
                  بله، لغو شود
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </motion.section>
  )
}
