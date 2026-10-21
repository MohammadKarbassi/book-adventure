"use client"

import { useState } from "react"
import { CheckIcon, ShieldCheckIcon } from "lucide-react"

import { ActivateDialog } from "@/components/subscription/activate-dialog"
import {
  perMonthPrice,
  savingsPercent,
} from "@/components/subscription/plan-pricing"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatNumber, formatPrice } from "@/lib/format"
import { SUBSCRIPTION_PLANS, getPlan, type PlanId } from "@/lib/plans"

export function PlanPicker() {
  const [planId, setPlanId] = useState<PlanId>("quarterly")
  const plan = getPlan(planId)

  return (
    <div className="flex flex-col gap-8">
      <RadioGroup
        value={planId}
        onValueChange={(value) => setPlanId(value as PlanId)}
        aria-label="طرح‌های اشتراک"
        className="grid gap-4 md:grid-cols-3 md:gap-6"
      >
        {SUBSCRIPTION_PLANS.map((item) => {
          const inputId = `plan-${item.id}`
          const savings = savingsPercent(item)
          return (
            <Label
              key={item.id}
              htmlFor={inputId}
              className="block cursor-pointer leading-normal font-normal select-auto"
            >
              <Card className="relative h-full gap-5 py-6 transition-shadow hover:shadow-md has-data-checked:shadow-lg has-data-checked:ring-2 has-data-checked:ring-primary motion-reduce:transition-none">
                <CardHeader className="px-6">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-2xl font-bold">
                    {item.title}
                    {item.badge ? (
                      <Badge
                        variant={item.id === "yearly" ? "accent" : "default"}
                      >
                        {item.badge}
                      </Badge>
                    ) : null}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                  <CardAction>
                    <RadioGroupItem
                      id={inputId}
                      value={item.id}
                      aria-label={`طرح ${item.title}`}
                      className="size-5"
                    />
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5 px-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-3xl font-bold tracking-tight">
                      {formatPrice(item.price)}
                    </p>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      {item.months > 1
                        ? `ماهی ${formatPrice(perMonthPrice(item))}`
                        : "پرداخت ماه‌به‌ماه"}
                      {savings > 0 ? (
                        <Badge variant="outline">
                          {`${formatNumber(savings)}٪ صرفه‌جویی`}
                        </Badge>
                      ) : null}
                    </p>
                  </div>
                  <ul className="flex flex-col gap-2.5 border-t pt-5">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckIcon
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-accent-foreground"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Label>
          )
        })}
      </RadioGroup>

      <div className="flex flex-col items-center gap-3 text-center">
        <ActivateDialog plan={plan} />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheckIcon aria-hidden="true" className="size-3.5" />
          پرداخت آزمایشی است و هزینه‌ای کسر نمی‌شود.
        </p>
      </div>
    </div>
  )
}
