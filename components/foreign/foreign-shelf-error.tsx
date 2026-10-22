import Link from "next/link"
import { CloudOffIcon, RotateCwIcon } from "lucide-react"

import { SectionHeader } from "@/components/book/section-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ForeignShelfErrorProps = {
  title: string
  description?: string
  headingId: string
  className?: string
}

/** One shelf that Open Library didn't return; the rest of the page still works. */
export function ForeignShelfError({
  title,
  description,
  headingId,
  className,
}: ForeignShelfErrorProps) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4", className)}
    >
      <SectionHeader id={headingId} title={title} description={description} />
      <Alert className="max-w-2xl">
        <CloudOffIcon />
        <AlertTitle>کتاب‌های این قفسه فعلاً در دسترس نیستند</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <p>پاسخی از Open Library نرسید. چند لحظهٔ دیگر دوباره امتحان کنید.</p>
          <Link
            href="/foreign"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "no-underline!"
            )}
          >
            <RotateCwIcon data-icon="inline-start" />
            تلاش دوباره
          </Link>
        </AlertDescription>
      </Alert>
    </section>
  )
}
