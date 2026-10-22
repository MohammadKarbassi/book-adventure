import type { Metadata } from "next"
import { SearchIcon, SearchXIcon } from "lucide-react"

import { SectionHeader } from "@/components/book/section-header"
import { BookGrid } from "@/components/browse/book-grid"
import { PodcastResultCard } from "@/components/browse/podcast-result-card"
import { SearchForm } from "@/components/browse/search-form"
import { SearchResults } from "@/components/browse/search-results"
import { SearchSuggestions } from "@/components/browse/search-suggestions"
import { Container } from "@/components/site/container"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  filterBooks,
  parseSearchParams,
  popularAuthors,
  type RawSearchParams,
  searchPodcasts,
  typeFilters,
} from "@/lib/browse"
import {
  getAllBooks,
  getCategories,
  searchBooks,
  toSummary,
} from "@/lib/catalog"
import { formatNumber } from "@/lib/format"
import { getPodcasts } from "@/lib/podcasts"

type SearchPageProps = { searchParams: Promise<RawSearchParams> }

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams)
  return {
    title: q ? `جستجوی «${q}»` : "جستجو",
    robots: { index: false },
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const state = parseSearchParams(await searchParams)
  const { q, type } = state

  const books = searchBooks(q)
  const podcasts = searchPodcasts(getPodcasts(), q)
  const counts = {
    all: books.length + podcasts.length,
    ebook: filterBooks(books, { type: "ebook" }).length,
    audio: filterBooks(books, { type: "audio" }).length,
  }
  const shownBooks = filterBooks(books, { type })
  // Podcasts are neither ebooks nor audiobooks: only under «همه».
  const shownPodcasts = type === "all" ? podcasts : []

  const suggestions = (
    <SearchSuggestions
      authors={popularAuthors(getAllBooks(), 8)}
      categories={getCategories()}
    />
  )

  return (
    <>
      <div className="border-b border-border bg-card/60">
        <Container className="flex max-w-3xl flex-col gap-4 py-8 md:py-10">
          <SearchForm query={q} type={type} />
        </Container>
      </div>

      <Container className="py-10">
        {!q ? (
          <Empty className="py-10">
            <EmptyHeader className="max-w-lg">
              <EmptyMedia
                variant="icon"
                className="size-16 rounded-full bg-accent text-accent-foreground"
              >
                <SearchIcon className="size-8" />
              </EmptyMedia>
              <EmptyTitle className="text-4xl font-bold">
                <h1>دنبال چه کتابی هستید؟</h1>
              </EmptyTitle>
              <EmptyDescription className="text-base">
                نام کتاب، نویسنده، مترجم، گوینده یا ناشر را بنویسید؛ یا از یکی
                از پیشنهادهای زیر شروع کنید.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="max-w-2xl">{suggestions}</EmptyContent>
          </Empty>
        ) : counts.all === 0 ? (
          <Empty className="py-10">
            <EmptyHeader className="max-w-lg">
              <EmptyMedia
                variant="icon"
                className="size-16 rounded-full bg-muted text-muted-foreground"
              >
                <SearchXIcon className="size-8" />
              </EmptyMedia>
              <EmptyTitle className="text-4xl font-bold">
                <h1>نتیجه‌ای پیدا نشد</h1>
              </EmptyTitle>
              <EmptyDescription className="text-base">
                برای «{q}» کتاب یا پادکستی پیدا نکردیم. املای کلمه‌ها را بررسی
                کنید یا عبارت کوتاه‌تری بنویسید.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="max-w-2xl">{suggestions}</EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-1">
              <h1 className="font-heading text-4xl leading-tight font-bold text-balance md:text-5xl">
                نتیجه‌های جستجو برای «{q}»
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatNumber(books.length)} کتاب
                {podcasts.length > 0
                  ? ` و ${formatNumber(podcasts.length)} پادکست`
                  : null}
              </p>
            </header>
            <SearchResults state={state} counts={counts}>
              {shownBooks.length > 0 ? (
                <section
                  aria-labelledby="book-results"
                  className="flex flex-col gap-6"
                >
                  <SectionHeader
                    id="book-results"
                    title={`کتاب‌ها (${formatNumber(shownBooks.length)})`}
                  />
                  <BookGrid
                    books={shownBooks.map(toSummary)}
                    priorityCount={6}
                  />
                </section>
              ) : (
                <Empty className="border border-border bg-card py-12">
                  <EmptyHeader>
                    <EmptyTitle className="text-2xl font-bold">
                      {`کتاب ${typeFilters.find((f) => f.value === type)?.label}‌ای با این عبارت نیست`}
                    </EmptyTitle>
                    <EmptyDescription>
                      نوع «همه» را انتخاب کنید تا همهٔ نتیجه‌ها را ببینید.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
              {shownPodcasts.length > 0 ? (
                <section
                  aria-labelledby="podcast-results"
                  className="flex flex-col gap-6"
                >
                  <SectionHeader
                    id="podcast-results"
                    title={`پادکست‌ها (${formatNumber(shownPodcasts.length)})`}
                  />
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {shownPodcasts.map((podcast) => (
                      <li key={podcast.id}>
                        <PodcastResultCard
                          query={q}
                          podcast={{
                            id: podcast.id,
                            title: podcast.title,
                            author: podcast.author,
                            artwork: podcast.artwork,
                            episodeCount: podcast.episodes.length,
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </SearchResults>
          </div>
        )}
      </Container>
    </>
  )
}
