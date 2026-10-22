import Link from "next/link"
import { ArrowLeftIcon, LanguagesIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FOREIGN_SUBJECTS } from "@/lib/foreign"
import { cn } from "@/lib/utils"

// Static on purpose: the home page never calls Open Library.
export function ForeignTeaser() {
  return (
    <Card
      role="region"
      aria-labelledby="foreign-heading"
      className="relative gap-0 overflow-hidden py-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-radial-[circle_at_0%_100%] from-accent/50 to-transparent to-60%"
      />
      <div className="relative flex flex-col gap-6 py-8 md:flex-row md:items-end md:justify-between md:py-10">
        <CardHeader className="max-w-2xl gap-2 px-6 md:px-10">
          <span className="flex size-10 items-center justify-center rounded-s-sm rounded-e-lg bg-accent text-accent-foreground shadow-sm">
            <LanguagesIcon className="size-5" />
          </span>
          <CardTitle className="mt-2 text-3xl font-bold md:text-4xl">
            <h2 id="foreign-heading">کتاب‌های خارجی، به زبان اصلی</h2>
          </CardTitle>
          <CardDescription className="text-base/relaxed text-pretty">
            از کتابخانهٔ باز Open Library: رمان‌های فانتزی و علمی‌تخیلی، معماهای
            جنایی، کلاسیک‌ها، تاریخ و فلسفه. هر کتاب را مثل بقیهٔ قفسه‌ها بخرید
            یا نشان کنید؛ در کتابخانهٔ شما کنار کتاب‌های فارسی می‌ماند.
          </CardDescription>
          <ul
            aria-label="قفسه‌ها"
            className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground"
          >
            {FOREIGN_SUBJECTS.map((subject) => (
              <li
                key={subject.slug}
                className="after:ms-3 after:content-['·'] last:after:content-none"
              >
                {subject.title}
              </li>
            ))}
          </ul>
        </CardHeader>
        <CardFooter className="border-0 bg-transparent px-6 py-0 md:px-10">
          <Link
            href="/foreign"
            className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
          >
            دیدن کتاب‌های خارجی
            <ArrowLeftIcon data-icon="inline-end" />
          </Link>
        </CardFooter>
      </div>
    </Card>
  )
}
