import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SectionHeader } from "@/components/book/section-header"
import { BookGrid } from "@/components/browse/book-grid"
import { CategoryAdventures } from "@/components/browse/category-adventures"
import { CategoryBrowser } from "@/components/browse/category-browser"
import { CategoryHeader } from "@/components/browse/category-header"
import { Container } from "@/components/site/container"
import { getAdventures } from "@/lib/adventures"
import {
  filterBooks,
  paginate,
  parseBrowseParams,
  type RawSearchParams,
  sortBooks,
} from "@/lib/browse"
import {
  getBooksByCategory,
  getCategories,
  getCategory,
  toSummary,
} from "@/lib/catalog"

type CategoryPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<RawSearchParams>
}

// Only the eight known categories exist; anything else is a real 404.
export const dynamicParams = false

export function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.slug }))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) return {}
  return {
    title: category.title,
    description: `کتاب‌های الکترونیکی و صوتی ${category.title} در ماجراجویی با کتاب`,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const state = parseBrowseParams(await searchParams)
  const books = getBooksByCategory(slug)

  // Only subcategories that actually have books here.
  const subcategories = category.subcategories
    .map((sub) => ({
      slug: sub.slug,
      title: sub.title,
      count: books.filter((book) => book.categoryTitles.includes(sub.title))
        .length,
    }))
    .filter((sub) => sub.count > 0)
  const activeSub = subcategories.find((sub) => sub.slug === state.sub)
  const effectiveState = { ...state, sub: activeSub?.slug ?? null }

  const filtered = filterBooks(books, {
    type: state.type,
    plus: state.plus,
    subcategoryTitle: activeSub?.title,
  })
  const slice = paginate(sortBooks(filtered, state.sort), state.page)
  const adventures = getAdventures().filter(
    (adventure) => adventure.book.categorySlug === slug
  )

  return (
    <>
      <CategoryHeader
        title={category.title}
        bookCount={books.length}
        audioCount={books.filter((book) => book.type === "audiobook").length}
        covers={sortBooks(books, "popular").slice(0, 3).map(toSummary)}
      />
      <Container className="flex flex-col gap-12 py-10">
        <CategoryAdventures adventures={adventures} />
        <section
          aria-labelledby="category-books"
          className="flex flex-col gap-6"
        >
          {/* Visible only when the adventures strip sits above it. */}
          <SectionHeader
            id="category-books"
            title="همهٔ کتاب‌های این قفسه"
            className={adventures.length > 0 ? undefined : "sr-only"}
          />
          <CategoryBrowser
            state={{ ...effectiveState, page: slice.page }}
            subcategories={subcategories}
            total={slice.total}
            categoryTotal={books.length}
            pageCount={slice.pageCount}
          >
            <BookGrid books={slice.items.map(toSummary)} priorityCount={6} />
          </CategoryBrowser>
        </section>
      </Container>
    </>
  )
}
