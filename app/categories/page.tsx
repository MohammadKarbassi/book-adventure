import type { Metadata } from "next"

import { CategoryCard } from "@/components/browse/category-card"
import { Container } from "@/components/site/container"
import { PageHero } from "@/components/site/page-hero"
import { sortBooks } from "@/lib/browse"
import { getBooksByCategory, getCategories, toSummary } from "@/lib/catalog"
import { isFeatureSafe } from "@/lib/feature-safe"
import { formatNumber } from "@/lib/format"

export const metadata: Metadata = {
  title: "دسته‌بندی‌ها",
  description: "همهٔ دسته‌های کتاب الکترونیکی و صوتی در ماجراجویی با کتاب",
}

export default function CategoriesPage() {
  const categories = getCategories().map((category) => {
    const books = getBooksByCategory(category.slug)
    return {
      slug: category.slug,
      title: category.title,
      bookCount: books.length,
      audioCount: books.filter((book) => book.type === "audiobook").length,
      covers: sortBooks(books, "popular")
        .filter(isFeatureSafe)
        .slice(0, 3)
        .map(toSummary),
    }
  })
  const total = categories.reduce(
    (sum, category) => sum + category.bookCount,
    0
  )

  return (
    <>
      <PageHero
        title="دسته‌بندی‌ها"
        description="از رمان فارسی تا فلسفه، قفسهٔ دلخواهتان را انتخاب کنید."
        meta={`${formatNumber(categories.length)} قفسه و ${formatNumber(total)} کتاب`}
      />
      <Container className="py-10 md:py-14">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <li key={category.slug}>
              <CategoryCard {...category} priority={index < 4} />
            </li>
          ))}
        </ul>
      </Container>
    </>
  )
}
