import type { Metadata } from "next"
import Link from "next/link"
import { HouseIcon, SearchIcon } from "lucide-react"

import { BookJourneyScene } from "@/components/site/book-journey-scene"
import { Container } from "@/components/site/container"
import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const metadata: Metadata = {
  title: "صفحه پیدا نشد",
}

export default function NotFound() {
  return (
    <Container className="flex min-h-[60svh] items-center py-16">
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            <BookJourneyScene className="w-64 sm:w-72" />
          </EmptyMedia>
          <EmptyTitle className="text-4xl font-bold">
            <h1>این صفحه پیدا نشد</h1>
          </EmptyTitle>
          <EmptyDescription className="text-base">
            شاید نشانی اشتباه تایپ شده یا این کتاب دیگر در قفسه نیست. از صفحهٔ
            اصلی یا جستجو، ماجراجویی را ادامه بدهید.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center">
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            <HouseIcon data-icon="inline-start" />
            بازگشت به خانه
          </Link>
          <Link
            href="/search"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            <SearchIcon data-icon="inline-start" />
            جستجوی کتاب
          </Link>
        </EmptyContent>
      </Empty>
    </Container>
  )
}
