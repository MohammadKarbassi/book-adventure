import type { Metadata } from "next"

import { LibrarySubscriptionLink } from "@/components/library/library-subscription-link"
import { LibraryView } from "@/components/library/library-view"
import { Container } from "@/components/site/container"
import { PageHero } from "@/components/site/page-hero"
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
    <>
      <PageHero
        title="کتابخانهٔ من"
        accent="کتابخانهٔ"
        description="کتاب‌هایی که خریده‌اید، نشان کرده‌اید یا با اشتراک در دسترس دارید، همه در یک قفسه."
        actions={<LibrarySubscriptionLink />}
      />
      <Container className="py-10 lg:py-12">
        <LibraryView books={books} />
      </Container>
    </>
  )
}
