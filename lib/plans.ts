// Subscription plans («اشتراک»). Prices in Toman.

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
  "بدون تبلیغ",
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
    features: [...baseFeatures, "ادامهٔ خواندن روی همهٔ دستگاه‌ها"],
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
      "ادامهٔ خواندن روی همهٔ دستگاه‌ها",
      "دسترسی زودهنگام به کتاب‌های تازه",
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
