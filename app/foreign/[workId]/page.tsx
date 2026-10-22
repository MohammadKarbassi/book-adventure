import type { Metadata } from "next"
import Link from "next/link"
import { GlobeIcon } from "lucide-react"

import { BookCover3D } from "@/components/book-detail/book-cover-3d"
import { RatingStars } from "@/components/book/rating-stars"
import { excerpt } from "@/components/book-detail/book-detail-utils"
import { BookFacts, type BookFact } from "@/components/book-detail/book-facts"
import {
  latinDir,
  latinLineClass,
} from "@/components/foreign/foreign-book-card"
import { ForeignPurchaseCard } from "@/components/foreign/foreign-purchase-card"
import { Container } from "@/components/site/container"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { openLibraryUrl, type ForeignBook } from "@/lib/foreign"
import { formatNumber, toPersianDigits } from "@/lib/format"
import { getForeignBook } from "@/lib/openlibrary"
import { cn } from "@/lib/utils"

type ForeignBookPageProps = { params: Promise<{ workId: string }> }

// Per request, like /foreign: failures aren't cached, data is (fetch cache).
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: ForeignBookPageProps): Promise<Metadata> {
  const book = await getForeignBook((await params).workId)
  const description = excerpt(
    book.description[0] ??
      `${book.title}${book.authors.length ? `، ${book.authors.join(", ")}` : ""}`
  )
  return {
    title: book.title,
    description,
    alternates: { canonical: `/foreign/${book.workId}` },
    openGraph: {
      type: "book",
      title: book.title,
      description,
      authors: book.authors,
      images: book.cover ? [{ url: book.cover, alt: book.title }] : undefined,
    },
  }
}

function facts(book: ForeignBook): BookFact[] {
  const authors = book.authors.join(", ")
  const list: (BookFact | false)[] = [
    authors.length > 0 && {
      label: "نویسنده",
      value: <span dir={latinDir(authors)}>{authors}</span>,
    },
    { label: "زبان", value: "انگلیسی (زبان اصلی)" },
    Boolean(book.year) && {
      label: "نخستین انتشار",
      value: toPersianDigits(book.year ?? ""),
    },
    Boolean(book.pages) && {
      label: "تعداد صفحات",
      value: `حدود ${formatNumber(book.pages ?? 0)} صفحه`,
    },
  ]
  return list.filter((fact): fact is BookFact => fact !== false)
}

export default async function ForeignBookPage({
  params,
}: ForeignBookPageProps) {
  const book = await getForeignBook((await params).workId)
  const authors = book.authors.join(", ")
  // The client card gets only the summary fields it stores and shows.
  const summary: ForeignBook = {
    id: book.id,
    workId: book.workId,
    title: book.title,
    authors: book.authors,
    cover: book.cover,
    year: book.year,
    pages: book.pages,
    rating: book.rating,
    ratingsCount: book.ratingsCount,
    price: book.price,
  }

  return (
    <article className="relative isolate">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-136 bg-linear-to-b from-secondary via-secondary/40 to-background"
      />

      <Container className="pt-6 pb-16">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/foreign" />}>
                کتاب‌های خارجی
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage
                dir={latinDir(book.title)}
                className="line-clamp-1"
              >
                {book.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[20rem_minmax(0,1fr)] xl:gap-20">
          <div className="flex justify-center lg:sticky lg:top-28 lg:self-start lg:pt-2">
            <BookCover3D
              book={{ title: book.title, image: book.cover }}
              binding="end"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-10">
            <header className="flex animate-in flex-col items-center gap-4 text-center duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none lg:items-start lg:text-start">
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                <Badge variant="secondary" className="h-6 px-2.5">
                  <GlobeIcon data-icon="inline-start" />
                  کتاب خارجی
                </Badge>
                <Badge variant="outline" className="h-6 px-2.5">
                  انگلیسی
                </Badge>
              </div>
              <h1
                dir={latinDir(book.title)}
                className={cn(
                  "font-heading text-4xl leading-tight font-bold text-balance sm:text-5xl lg:text-6xl",
                  latinLineClass
                )}
              >
                {book.title}
              </h1>
              <p className="text-lg text-pretty text-foreground/80">
                {authors ? (
                  <>
                    نوشتهٔ <span dir={latinDir(authors)}>{authors}</span>
                  </>
                ) : (
                  "نویسندهٔ نامشخص"
                )}
                {book.year ? `؛ ${toPersianDigits(book.year)}` : null}
              </p>
              {book.rating ? (
                <RatingStars
                  rating={book.rating}
                  count={book.ratingsCount}
                  className="text-sm"
                />
              ) : null}
            </header>

            <ForeignPurchaseCard
              book={summary}
              className="animate-in delay-100 duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
            />

            <section
              aria-label="مشخصات"
              className="flex animate-in flex-col gap-8 delay-200 duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
            >
              <BookFacts facts={facts(book)} />
              {book.subjects.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <h2 className="font-heading text-xl font-bold">موضوع‌ها</h2>
                  <ul aria-label="موضوع‌ها" className="flex flex-wrap gap-1.5">
                    {book.subjects.map((subject) => (
                      <li key={subject}>
                        <Badge
                          variant="outline"
                          dir={latinDir(subject)}
                          className="h-6 border-foreground/15 px-2.5"
                        >
                          {subject}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section
              aria-labelledby="about-heading"
              className="flex flex-col gap-5"
            >
              <h2
                id="about-heading"
                className="border-b pb-3 font-heading text-2xl font-bold"
              >
                معرفی
              </h2>
              {book.description.length > 0 ? (
                <div dir="ltr" className="flex flex-col gap-4">
                  {book.description.map((paragraph, index) => (
                    <p
                      key={index}
                      className="max-w-prose text-start text-base leading-relaxed text-pretty text-foreground/85"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">توضیحی ثبت نشده است.</p>
              )}
              <p className="text-xs text-muted-foreground">
                اطلاعات این صفحه از{" "}
                <a
                  href={openLibraryUrl(book.workId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Open Library
                </a>{" "}
                است؛ قیمت نمایشی است.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </article>
  )
}
