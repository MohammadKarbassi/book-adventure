"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CloudOffIcon, RotateCwIcon } from "lucide-react"

import { Container } from "@/components/site/container"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// Open Library is down or slow: say so plainly and offer a retry, which
// re-fetches the server render (retry = router.refresh + reset).
export default function ForeignError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  useEffect(() => {
    console.warn(error)
  }, [error])

  return (
    <Container className="flex min-h-[60svh] items-center py-16">
      <Empty>
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="size-20 rounded-s-md rounded-e-2xl bg-accent text-accent-foreground"
          >
            <CloudOffIcon className="size-10" />
          </EmptyMedia>
          <EmptyTitle className="text-3xl font-bold md:text-4xl">
            <h1>دریافت کتاب‌های خارجی ممکن نشد</h1>
          </EmptyTitle>
          <EmptyDescription className="text-base">
            پاسخی از Open Library نرسید؛ شاید اینترنت قطع است یا سرویس موقتاً در
            دسترس نیست. چند لحظهٔ دیگر دوباره امتحان کنید.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row flex-wrap justify-center">
          <Button size="lg" onClick={() => retry()}>
            <RotateCwIcon data-icon="inline-start" />
            تلاش دوباره
          </Button>
          <Link
            href="/"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            بازگشت به خانه
          </Link>
        </EmptyContent>
      </Empty>
    </Container>
  )
}
