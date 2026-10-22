// Subscription plans («اشتراک»). Prices in Toman. Features must be true for
// this site: no accounts or server, so nothing that needs them (sync, etc.).

export type PlanId = "monthly" | "quarterly" | "yearly"

export type SubscriptionPlan = {
  id: PlanId
  title: string
  months: number
  /** Total price for the whole period, in Toman. */
  price: number
  badge?: string
  description: string
  features: string[]
}

const baseFeatures = [
  "دسترسی به همهٔ کتاب‌های اشتراکی",
  "شنیدن کتاب‌های صوتی اشتراکی",
  "ذخیرهٔ جای خواندن و شنیدن در همین مرورگر",
]

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    title: "یک‌ماهه",
    months: 1,
    price: 99000,
    description: "برای شروع ماجراجویی و آشنایی با کتاب‌های اشتراکی.",
    features: [...baseFeatures, "لغو در هر زمان"],
  },
  {
    id: "quarterly",
    title: "سه‌ماهه",
    months: 3,
    price: 249000,
    badge: "محبوب‌ترین",
    description: "یک فصل کامل کتاب‌خوانی، ارزان‌تر از اشتراک ماهانه.",
    features: [...baseFeatures, "سه ماه دسترسی پیوسته"],
  },
  {
    id: "yearly",
    title: "یک‌ساله",
    months: 12,
    price: 790000,
    badge: "به‌صرفه‌ترین",
    description: "یک سال ماجراجویی بی‌وقفه با کم‌ترین هزینهٔ ماهانه.",
    features: [
      ...baseFeatures,
      "دوازده ماه دسترسی پیوسته",
      "کم‌ترین هزینهٔ ماهانه",
    ],
  },
]

export function getPlan(id: PlanId): SubscriptionPlan
export function getPlan(id: string): SubscriptionPlan | undefined
export function getPlan(id: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id)
}

export function isPlanId(value: unknown): value is PlanId {
  return SUBSCRIPTION_PLANS.some((plan) => plan.id === value)
}
