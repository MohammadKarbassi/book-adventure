import type { Metadata } from "next"
import Link from "next/link"

import { CoverFan } from "@/components/browse/cover-fan"
import { ForeignBookRow } from "@/components/foreign/foreign-book-row"
import { ForeignShelfError } from "@/components/foreign/foreign-shelf-error"
import { Container } from "@/components/site/container"
import { PageHero } from "@/components/site/page-hero"
import { buttonVariants } from "@/components/ui/button"
import { isFeatureSafe } from "@/lib/feature-safe"
import { FOREIGN_SUBJECTS } from "@/lib/foreign"
import { OpenLibraryError, getForeignShelf } from "@/lib/openlibrary"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "کتاب‌های خارجی",
  description:
    "کتاب‌های خارجی به زبان اصلی، از کتابخانهٔ باز Open Library: فانتزی، علمی‌تخیلی، معمایی، کلاسیک، تاریخ و فلسفه.",
}

// Rendered per request so an Open Library outage is never cached as the
// page; successful responses still come from the fetch cache for a day.
export const dynamic = "force-dynamic"

const headingId = (slug: string) => `shelf-${slug}`

export default async function ForeignPage() {
  // One failing subject shouldn't take the others down.
  const results = await Promise.allSettled(
    FOREIGN_SUBJECTS.map((subject) => getForeignShelf(subject.slug))
  )
  if (results.every((result) => result.status === "rejected")) {
    // Nothing to show at all: let error.tsx offer a retry.
    throw new OpenLibraryError("Every Open Library shelf failed", {
      cause: results[0].reason,
    })
  }
  const shelves = FOREIGN_SUBJECTS.map((subject, index) => ({
    ...subject,
    result: results[index],
  }))
  const fanBooks = shelves
    .flatMap(({ result }) =>
      result.status === "fulfilled" ? result.value : []
    )
    .filter(isFeatureSafe)
    .slice(0, 3)

  return (
    <>
      <PageHero
        title="کتاب‌های خارجی"
        accent="خارجی"
        description={
          <>
            رمان‌ها و کتاب‌هایی که دنیا می‌خواند، همان‌طور که نوشته شده‌اند.
            فهرست‌ها و توضیح‌ها از{" "}
            <a
              href="https://openlibrary.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4 hover:text-accent-foreground"
            >
              Open Library
            </a>{" "}
            می‌آیند؛ قیمت‌ها نمایشی‌اند.
          </>
        }
        meta="به زبان اصلی، از کتابخانهٔ باز Open Library"
        actions={
          <nav aria-label="قفسه‌های کتاب خارجی">
            <ul className="flex flex-wrap gap-2">
              {FOREIGN_SUBJECTS.map((subject) => (
                <li key={subject.slug}>
                  <Link
                    href={`#${subject.slug}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "rounded-full"
                    )}
                  >
                    {subject.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        }
        aside={
          fanBooks.length > 0 ? (
            <CoverFan
              books={fanBooks.map((book) => ({
                id: book.id,
                title: book.title,
                image: book.cover,
              }))}
              priority
              className="group/fan w-56 md:w-72 lg:w-96"
            />
          ) : null
        }
      />

      <Container className="flex flex-col gap-16 py-12">
        {shelves.map(({ slug, title, description, result }, index) => (
          <div key={slug} id={slug} className="scroll-mt-24">
            {result.status === "fulfilled" && result.value.length > 0 ? (
              <ForeignBookRow
                headingId={headingId(slug)}
                title={title}
                description={description}
                books={result.value}
                priority={index === 0}
              />
            ) : (
              <ForeignShelfError
                headingId={headingId(slug)}
                title={title}
                description={description}
              />
            )}
          </div>
        ))}
      </Container>
    </>
  )
}
