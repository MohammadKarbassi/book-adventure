import Link from "next/link"
import { ArrowLeftIcon, CheckIcon, CrownIcon } from "lucide-react"

import { BookCover } from "@/components/book/book-cover"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { BookSummary } from "@/lib/catalog"
import { isFeatureSafe } from "@/lib/feature-safe"
import { formatPrice } from "@/lib/format"
import { SUBSCRIPTION_PLANS } from "@/lib/plans"

// Features every plan shares, and the lowest price per month.
const features = SUBSCRIPTION_PLANS[0].features.slice(0, 3)
const fromPerMonth = Math.min(
  ...SUBSCRIPTION_PLANS.map((plan) => Math.round(plan.price / plan.months))
)

/** Fanned covers: rotation and offset per position, outermost first. */
const fan = [
  "-rotate-8 translate-y-3",
  "-rotate-3",
  "rotate-3",
  "rotate-8 translate-y-3",
]

export function SubscriptionTeaser({ covers }: { covers: BookSummary[] }) {
  return (
    <Card
      aria-labelledby="subscription-heading"
      role="region"
      className="relative grid gap-0 py-0 md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]"
    >
      <div className="flex flex-col gap-6 py-8 md:py-10">
        <CardHeader className="gap-2 px-6 md:px-10">
          <span className="flex size-10 items-center justify-center rounded-s-sm rounded-e-lg bg-primary text-primary-foreground shadow-sm">
            <CrownIcon className="size-5" />
          </span>
          <CardTitle className="mt-2 text-3xl font-bold md:text-4xl">
            <h2 id="subscription-heading">
              ماجراجویی پلاس: یک اشتراک برای ماجراجویی بدون مرز
            </h2>
          </CardTitle>
          <CardDescription className="max-w-md text-base">
            صدها کتاب و کتاب صوتی اشتراکی، از ماهی {formatPrice(fromPerMonth)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 md:px-10">
          <ul className="flex flex-col gap-2.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <CheckIcon className="size-3.5" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="border-0 bg-transparent px-6 py-0 md:px-10">
          <Link
            href="/subscription"
            className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
          >
            مشاهدهٔ طرح‌های اشتراک
            <ArrowLeftIcon data-icon="inline-end" />
          </Link>
        </CardFooter>
      </div>
      <div
        aria-hidden="true"
        className="relative hidden items-center justify-center overflow-hidden bg-muted/60 md:flex"
      >
        <div className="pointer-events-none absolute inset-0 bg-radial-[circle_at_50%_60%] from-primary/20 to-transparent to-70%" />
        <div className="relative flex -space-x-10 py-10">
          {covers
            .filter(isFeatureSafe)
            .slice(0, fan.length)
            .map((book, index) => (
              <BookCover
                key={book.id}
                book={book}
                size="md"
                className={`${fan[index]} shadow-xl`}
              />
            ))}
        </div>
      </div>
    </Card>
  )
}
