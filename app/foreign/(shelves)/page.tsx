import type { Metadata } from "next"
import Link from "next/link"
import { GlobeIcon } from "lucide-react"

import { CoverFan } from "@/components/browse/cover-fan"
import { ForeignBookRow } from "@/components/foreign/foreign-book-row"
import { ForeignShelfError } from "@/components/foreign/foreign-shelf-error"
import { Container } from "@/components/site/container"
import { buttonVariants } from "@/components/ui/button"
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
    .slice(0, 3)

  return (
    <>
      <header className="overflow-hidden border-b border-border bg-card/60">
        <Container className="flex items-end justify-between gap-8 pt-10 md:pt-14">
          <div className="flex max-w-xl flex-col gap-5 pb-10 md:pb-14">
            <span className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground ring-8 ring-accent/40">
              <GlobeIcon className="size-8" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-5xl leading-tight font-bold md:text-6xl">
                کتاب‌های خارجی
              </h1>
              <p className="text-sm font-medium text-accent-foreground">
                به زبان اصلی، از کتابخانهٔ باز Open Library
              </p>
            </div>
            <p className="text-lg/relaxed text-pretty text-muted-foreground">
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
            </p>
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
          </div>
          {fanBooks.length > 0 ? (
            <CoverFan
              books={fanBooks.map((book) => ({
                id: book.id,
                title: book.title,
                image: book.cover,
              }))}
              priority
              className="hidden w-72 shrink-0 translate-y-2 md:flex lg:w-96"
            />
          ) : null}
        </Container>
      </header>

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
