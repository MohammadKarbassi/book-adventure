import type { Metadata } from "next"

import { LibraryView } from "@/components/library/library-view"
import { Container } from "@/components/site/container"
import { getAllBooks, toSummary } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "کتابخانهٔ من",
  description: "کتاب‌های خریده‌شده، علاقه‌مندی‌ها و کتاب‌های اشتراکی شما.",
}

// Purchases and favorites live in localStorage, so the client view resolves
// them against this slim index of the whole catalog.
export default function LibraryPage() {
  const books = getAllBooks().map(toSummary)
  return (
    <Container className="py-10 lg:py-14">
      <LibraryView books={books} />
    </Container>
  )
}
