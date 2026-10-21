// Pure pricing and period math for the subscription page.

import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@/lib/plans"
import type { Subscription } from "@/lib/store-core"

const DAY = 86_400_000

const monthlyPlan = SUBSCRIPTION_PLANS.find((plan) => plan.months === 1)

/** Price per month, rounded to the nearest 100 Toman. */
export function perMonthPrice(
  plan: Pick<SubscriptionPlan, "price" | "months">
) {
  return Math.round(plan.price / plan.months / 100) * 100
}

/** Whole percent saved compared with paying the monthly plan every month. */
export function savingsPercent(
  plan: Pick<SubscriptionPlan, "price" | "months">
): number {
  if (!monthlyPlan || plan.months <= 1) return 0
  const full = monthlyPlan.price * plan.months
  return Math.max(0, Math.floor((1 - plan.price / full) * 100))
}

/** Days left, rounded up (a few hours left still counts as one day). */
export function remainingDays(
  subscription: Pick<Subscription, "expiresAt">,
  now: number
): number {
  const left = Date.parse(subscription.expiresAt) - now
  return left > 0 ? Math.ceil(left / DAY) : 0
}

/** Share of the period still left, 0–100. */
export function remainingPercent(
  subscription: Pick<Subscription, "startedAt" | "expiresAt">,
  now: number
): number {
  const start = Date.parse(subscription.startedAt)
  const end = Date.parse(subscription.expiresAt)
  if (end <= start) return 0
  const percent = ((end - now) / (end - start)) * 100
  return Math.min(100, Math.max(0, Math.round(percent)))
}
