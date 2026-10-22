import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpenTextIcon, HeadphonesIcon } from "lucide-react"

import { BookRow } from "@/components/book/book-row"
import { BookCover3D } from "@/components/book-detail/book-cover-3d"
import { BookFacts, type BookFact } from "@/components/book-detail/book-facts"
import {
  cleanText,
  excerpt,
  isLatin,
  parseBookId,
} from "@/components/book-detail/book-detail-utils"
import {
  BookReviews,
  ReviewsTabTrigger,
} from "@/components/book-detail/book-reviews"
import { buildBookTrack } from "@/components/book-detail/book-track"
import { PurchaseCard } from "@/components/book-detail/purchase-card"
import { RatingSummary } from "@/components/book-detail/rating-summary"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSampleForBook } from "@/lib/audio-samples"
import {
  getAllBooks,
  getBook,
  getCategory,
  getSimilarBooks,
  toSummary,
  type Book,
} from "@/lib/catalog"
import { formatDuration, formatNumber, formatPrice } from "@/lib/format"

type BookPageProps = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return getAllBooks().map((book) => ({ id: String(book.id) }))
}

function findBook(id: string): Book | undefined {
  const bookId = parseBookId(id)
  return bookId === null ? undefined : getBook(bookId)
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const book = findBook((await params).id)
  if (!book) return {}
  const description = excerpt(book.description[0] ?? book.title)
  return {
    title: book.title,
    description,
    alternates: { canonical: `/book/${book.id}` },
    openGraph: {
      type: "book",
      title: book.title,
      description,
      authors: book.authors,
      images: [{ url: book.image, alt: book.title }],
    },
  }
}

const join = (names?: string[]) =>
  names && names.length > 0 ? names.join("، ") : undefined

/** Header facts: who made it and how long it is. */
function summaryFacts(book: Book): BookFact[] {
  const facts: (BookFact | false)[] = [
    { label: "نویسنده", value: join(book.authors) },
    { label: "مترجم", value: join(book.translators) },
    { label: "گوینده", value: join(book.narrators) },
    { label: "ناشر", value: book.publisher },
    { label: "تاریخ انتشار", value: book.published },
    book.type === "audiobook"
      ? {
          label: "مدت",
          value: book.durationSeconds
            ? formatDuration(book.durationSeconds)
            : undefined,
        }
      : {
          label: "تعداد صفحات",
          value: book.pages ? `${formatNumber(book.pages)} صفحه` : undefined,
        },
    { label: "حجم", value: book.fileSize },
  ]
  return facts.filter(
    (fact): fact is BookFact => fact !== false && Boolean(fact.value)
  )
}

export default async function BookPage({ params }: BookPageProps) {
  const book = findBook((await params).id)
  if (!book) notFound()

  const category = getCategory(book.categorySlug)
  const isAudio = book.type === "audiobook"
  const originalTitle = book.originalTitle
    ? cleanText(book.originalTitle)
    : undefined
  const sample = isAudio ? getSampleForBook(book.id) : undefined
  const track = sample ? buildBookTrack(book, sample) : undefined
  const similar = getSimilarBooks(book, 12).map(toSummary)
  const byline = [
    `نوشتهٔ ${join(book.authors) ?? "ناشناس"}`,
    book.translators?.length ? `ترجمهٔ ${join(book.translators)}` : null,
    book.narrators?.length ? `با صدای ${join(book.narrators)}` : null,
  ].filter(Boolean)

  const specs: BookFact[] = [
    { label: "عنوان", value: book.title },
    ...(originalTitle
      ? [
          {
            label: "عنوان اصلی",
            value: (
              <span dir={isLatin(originalTitle) ? "ltr" : undefined}>
                {originalTitle}
              </span>
            ),
          },
        ]
      : []),
    { label: "نوع", value: isAudio ? "کتاب صوتی" : "کتاب الکترونیکی" },
    ...summaryFacts(book),
    ...(book.printedPrice
      ? [{ label: "قیمت نسخهٔ چاپی", value: formatPrice(book.printedPrice) }]
      : []),
    {
      label: "دسته‌بندی",
      value: (
        <span className="inline-flex flex-wrap justify-end gap-1.5">
          {book.categoryTitles.map((title) =>
            category && title === category.title ? (
              <Badge
                key={title}
                variant="accent"
                render={<Link href={`/category/${category.slug}`} />}
              >
                {title}
              </Badge>
            ) : (
              <Badge key={title} variant="outline">
                {title}
              </Badge>
            )
          )}
        </span>
      ),
    },
  ]

  return (
    <article
      className="relative isolate"
      style={{ "--book": book.color.dominant } as React.CSSProperties}
    >
      {/* The cover's color washes the top of the page, then fades out. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-136 bg-linear-to-b from-[color-mix(in_oklch,var(--book)_16%,var(--background))] via-[color-mix(in_oklch,var(--book)_9%,var(--background))] to-background dark:from-[color-mix(in_oklch,var(--book)_30%,var(--background))] dark:via-[color-mix(in_oklch,var(--book)_14%,var(--background))]"
      />

      <Container className="pt-6 pb-16">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>خانه</BreadcrumbLink>
            </BreadcrumbItem>
            {category ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link href={`/category/${category.slug}`} />}
                  >
                    {category.title}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            ) : null}
            <BreadcrumbSeparator />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="line-clamp-1">
                {book.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[20rem_minmax(0,1fr)] xl:gap-20">
          <div className="flex justify-center lg:sticky lg:top-28 lg:self-start lg:pt-2">
            <BookCover3D book={book} />
          </div>

          <div className="flex min-w-0 flex-col gap-10">
            <header className="flex animate-in flex-col items-center gap-4 text-center duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none lg:items-start lg:text-start">
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                <Badge variant="secondary" className="h-6 px-2.5">
                  {isAudio ? (
                    <HeadphonesIcon data-icon="inline-start" />
                  ) : (
                    <BookOpenTextIcon data-icon="inline-start" />
                  )}
                  {isAudio ? "کتاب صوتی" : "کتاب الکترونیکی"}
                </Badge>
                {book.free ? (
                  <Badge className="h-6 px-2.5">رایگان</Badge>
                ) : null}
                {book.inPlus && !book.free ? (
                  <Badge variant="accent" className="h-6 px-2.5">
                    اشتراکی
                  </Badge>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="font-heading text-4xl leading-tight font-bold text-balance sm:text-5xl lg:text-6xl">
                  {book.title}
                </h1>
                {originalTitle ? (
                  <p
                    dir={isLatin(originalTitle) ? "ltr" : undefined}
                    className="text-base text-muted-foreground lg:self-start"
                  >
                    {originalTitle}
                  </p>
                ) : null}
              </div>
              <p className="text-lg text-pretty text-foreground/80">
                {byline.join("؛ ")}
              </p>
              {book.moods.length > 0 ? (
                <ul
                  aria-label="حس‌وحال کتاب"
                  className="flex flex-wrap justify-center gap-1.5 lg:justify-start"
                >
                  {book.moods.map((mood) => (
                    <li key={mood}>
                      <Badge
                        variant="outline"
                        className="h-6 border-foreground/15 px-2.5"
                      >
                        {mood}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
            </header>

            <PurchaseCard
              className="animate-in delay-100 duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
              book={{
                id: book.id,
                title: book.title,
                type: book.type,
                authors: book.authors,
                image: book.image,
                color: book.color,
                finalPrice: book.finalPrice,
                price: book.price,
                discountPct: book.discountPct,
                free: book.free,
                inPlus: book.inPlus,
                printedPrice: book.printedPrice,
              }}
              track={track}
              sampleCredit={
                sample
                  ? {
                      license: sample.license,
                      licenseUrl: sample.licenseUrl,
                      sourceUrl: sample.sourceUrl,
                    }
                  : undefined
              }
            />

            <section
              aria-label="خلاصهٔ مشخصات"
              className="flex animate-in flex-col gap-8 delay-200 duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none"
            >
              <BookFacts facts={summaryFacts(book)} />
              <RatingSummary
                rating={book.rating}
                ratingsCount={book.ratingsCount}
                distribution={book.ratingDistribution}
                className="rounded-xl border bg-card/60 p-5"
              />
            </section>

            <Tabs defaultValue="about" className="gap-6">
              <TabsList
                variant="line"
                className="w-full justify-start gap-4 border-b pb-0 group-data-horizontal/tabs:h-11"
              >
                <TabsTrigger value="about" className="flex-none px-1 text-base">
                  معرفی
                </TabsTrigger>
                <TabsTrigger value="specs" className="flex-none px-1 text-base">
                  مشخصات
                </TabsTrigger>
                <ReviewsTabTrigger
                  value="reviews"
                  bookId={book.id}
                  reviewsCount={book.reviewsCount}
                  className="flex-none px-1 text-base"
                />
              </TabsList>

              <TabsContent value="about" className="flex flex-col gap-5">
                {book.description.map((paragraph, index) => (
                  <p
                    key={index}
                    className={
                      index === 0
                        ? "max-w-prose text-lg leading-loose text-pretty text-foreground"
                        : "max-w-prose text-base leading-loose text-pretty text-foreground/85"
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </TabsContent>

              <TabsContent value="specs">
                <BookFacts facts={specs} columns={1} className="max-w-2xl" />
              </TabsContent>

              <TabsContent value="reviews">
                <BookReviews
                  bookId={book.id}
                  reviews={book.reviews}
                  reviewsCount={book.reviewsCount}
                  fidiboUrl={book.fidiboUrl}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Container>

      {similar.length > 0 ? (
        <Container className="border-t pt-12 pb-16">
          <BookRow
            title="کتاب‌های مشابه"
            description={
              category ? `از قفسهٔ ${category.title}` : "از همین قفسه"
            }
            href={category ? `/category/${category.slug}` : undefined}
            books={similar}
          />
        </Container>
      ) : null}
    </article>
  )
}
