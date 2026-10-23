import type { Metadata } from "next"

import { BookRow } from "@/components/book/book-row"
import { SectionHeader } from "@/components/book/section-header"
import { BookGrid } from "@/components/browse/book-grid"
import { CoverFan } from "@/components/browse/cover-fan"
import { Container } from "@/components/site/container"
import { PageHero } from "@/components/site/page-hero"
import { serializeBrowseParams, sortBooks } from "@/lib/browse"
import { getBooksByType, getCategories, toSummary } from "@/lib/catalog"
import { isFeatureSafe } from "@/lib/feature-safe"
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
      <PageHero
        title="کتاب‌های صوتی"
        accent="صوتی"
        description="هر جا که هستید، کتاب همراهتان است؛ در راه، در آشپزخانه یا پیش از خواب، چشم‌ها را ببندید و قصه را بشنوید."
        meta={`${formatNumber(audiobooks.length)} کتاب صوتی با صدای ${formatNumber(narratorCount)} گوینده`}
        aside={
          <CoverFan
            books={audiobooks.filter(isFeatureSafe).slice(0, 3).map(toSummary)}
            priority
            className="group/fan w-56 md:w-72 lg:w-96"
          />
        }
      />

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
