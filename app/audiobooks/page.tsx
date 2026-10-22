import type { Metadata } from "next"
import { HeadphonesIcon } from "lucide-react"

import { BookRow } from "@/components/book/book-row"
import { SectionHeader } from "@/components/book/section-header"
import { BookGrid } from "@/components/browse/book-grid"
import { CoverFan } from "@/components/browse/cover-fan"
import { Container } from "@/components/site/container"
import { serializeBrowseParams, sortBooks } from "@/lib/browse"
import { getBooksByType, getCategories, toSummary } from "@/lib/catalog"
import { formatNumber } from "@/lib/format"

export const metadata: Metadata = {
  title: "کتاب‌های صوتی",
  description:
    "کتاب‌های صوتی فارسی با صدای گویندگان خوب؛ در راه، در آشپزخانه یا پیش از خواب گوش کنید.",
}

export default function AudiobooksPage() {
  const audiobooks = sortBooks(getBooksByType("audiobook"), "popular")
  const narratorCount = new Set(
    audiobooks.flatMap((book) => book.narrators ?? [])
  ).size
  const shelves = getCategories()
    .map((category) => ({
      ...category,
      books: audiobooks.filter((book) => book.categorySlug === category.slug),
    }))
    .filter((shelf) => shelf.books.length > 0)

  return (
    <>
      <header className="overflow-hidden border-b border-border bg-card/60">
        <Container className="flex items-end justify-between gap-8 pt-10 md:pt-14">
          <div className="flex max-w-xl flex-col gap-5 pb-10 md:pb-14">
            <span className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground ring-8 ring-accent/40">
              <HeadphonesIcon className="size-8" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-5xl leading-tight font-bold md:text-6xl">
                کتاب‌های صوتی
              </h1>
              <p className="text-sm font-medium text-accent-foreground">
                {formatNumber(audiobooks.length)} کتاب صوتی با صدای{" "}
                {formatNumber(narratorCount)} گوینده
              </p>
            </div>
            <p className="text-lg/relaxed text-pretty text-muted-foreground">
              هر جا که هستید، کتاب همراهتان است؛ در راه، در آشپزخانه یا پیش از
              خواب، چشم‌ها را ببندید و قصه را بشنوید.
            </p>
          </div>
          <CoverFan
            books={audiobooks.slice(0, 3).map(toSummary)}
            priority
            className="hidden w-72 shrink-0 translate-y-2 md:flex lg:w-96"
          />
        </Container>
      </header>

      <Container className="flex flex-col gap-16 py-12">
        <section
          aria-labelledby="most-listened"
          className="flex flex-col gap-6"
        >
          <SectionHeader
            id="most-listened"
            title="پرشنونده‌ترین‌ها"
            description="کتاب‌های صوتی‌ای که بیشترین شنونده را داشته‌اند"
          />
          <BookGrid
            books={audiobooks.slice(0, 12).map(toSummary)}
            priorityCount={6}
          />
        </section>

        {shelves.map((shelf) => (
          <BookRow
            key={shelf.slug}
            title={shelf.title}
            description={`${formatNumber(shelf.books.length)} کتاب صوتی`}
            href={`/category/${shelf.slug}${serializeBrowseParams({ type: "audio" })}`}
            books={shelf.books.map(toSummary)}
          />
        ))}
      </Container>
    </>
  )
}
