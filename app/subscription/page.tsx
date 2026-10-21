import type { Metadata } from "next"
import { CrownIcon, HeadphonesIcon, LibraryBigIcon } from "lucide-react"

import { BookRow } from "@/components/book/book-row"
import { SectionHeader } from "@/components/book/section-header"
import { Container } from "@/components/site/container"
import { CoverFan } from "@/components/subscription/cover-fan"
import { PlanPicker } from "@/components/subscription/plan-picker"
import {
  PLANS_SECTION_ID,
  PLUS_BOOKS_SECTION_ID,
} from "@/components/subscription/scroll-to-section"
import { SubscriptionFaq } from "@/components/subscription/subscription-faq"
import { SubscriptionStatus } from "@/components/subscription/subscription-status"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getAllBooks, getList, toSummary } from "@/lib/catalog"
import { formatNumber } from "@/lib/format"

export const metadata: Metadata = {
  title: "اشتراک ماجراجویی",
  description:
    "با اشتراک ماجراجویی، همهٔ کتاب‌های اشتراکی، الکترونیکی و صوتی، بدون خرید جداگانه باز می‌شوند.",
}

export default function SubscriptionPage() {
  const plusBooks = getAllBooks()
    .filter((book) => book.inPlus)
    .sort((a, b) => b.ratingsCount - a.ratingsCount)
  const plusAudioCount = plusBooks.filter(
    (book) => book.type === "audiobook"
  ).length
  const fanBooks = getList("plus")
    .slice(0, 5)
    .map(({ id, title, image, color }) => ({ id, title, image, color }))

  return (
    <div className="flex flex-col gap-20 pb-20">
      <section className="overflow-hidden border-b bg-secondary/40">
        <Container className="flex flex-col gap-10 py-10 lg:py-14">
          <SubscriptionStatus />
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,28rem)]">
            <div className="flex flex-col items-start gap-5">
              <Badge variant="accent" className="h-6 px-2.5 text-sm">
                <CrownIcon data-icon="inline-start" />
                یک اشتراک، قفسه‌ای پر از کتاب
              </Badge>
              <h1 className="font-heading text-5xl leading-tight font-bold text-balance lg:text-6xl">
                اشتراک ماجراجویی
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                {`با اشتراک ماجراجویی، همهٔ کتاب‌هایی که نشان «اشتراکی» دارند بدون خرید جداگانه برایتان باز می‌شوند؛ چه بخوانید، چه گوش کنید. همین حالا ${formatNumber(plusBooks.length)} کتاب اشتراکی در قفسه منتظر شماست.`}
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <LibraryBigIcon
                    aria-hidden="true"
                    className="size-4 text-accent-foreground"
                  />
                  {`${formatNumber(plusBooks.length)} کتاب اشتراکی`}
                </li>
                <li className="flex items-center gap-2">
                  <HeadphonesIcon
                    aria-hidden="true"
                    className="size-4 text-accent-foreground"
                  />
                  {`${formatNumber(plusAudioCount)} کتاب صوتی`}
                </li>
              </ul>
              <div className="mt-2 flex flex-wrap gap-3">
                <a
                  href={`#${PLANS_SECTION_ID}`}
                  className={buttonVariants({ size: "lg" })}
                >
                  انتخاب طرح
                </a>
                <a
                  href={`#${PLUS_BOOKS_SECTION_ID}`}
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  دیدن کتاب‌های اشتراکی
                </a>
              </div>
            </div>
            <CoverFan books={fanBooks} />
          </div>
        </Container>
      </section>

      <Container>
        <section
          id={PLANS_SECTION_ID}
          tabIndex={-1}
          aria-labelledby="plans-heading"
          className="flex scroll-mt-24 flex-col gap-8 outline-none"
        >
          <SectionHeader
            id="plans-heading"
            title="طرح خود را انتخاب کنید"
            description="هر طرح همهٔ کتاب‌های اشتراکی را باز می‌کند؛ طرح‌های بلندتر ارزان‌ترند."
          />
          <PlanPicker />
        </section>
      </Container>

      <Container>
        <section
          id={PLUS_BOOKS_SECTION_ID}
          tabIndex={-1}
          className="scroll-mt-24 outline-none"
        >
          <BookRow
            title="کتاب‌های اشتراکی"
            description="با اشتراک فعال، این کتاب‌ها بدون خرید باز می‌شوند."
            books={plusBooks.map(toSummary)}
          />
        </section>
      </Container>

      <Container>
        <section
          aria-labelledby="faq-heading"
          className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16"
        >
          <SectionHeader
            id="faq-heading"
            title="پرسش‌های پرتکرار"
            description="هر چه دربارهٔ اشتراک باید بدانید، کوتاه و روشن."
            className="items-start"
          />
          <SubscriptionFaq plusCount={plusBooks.length} />
        </section>
      </Container>
    </div>
  )
}
