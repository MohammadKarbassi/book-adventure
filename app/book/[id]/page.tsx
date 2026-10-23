import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  BookOpenTextIcon,
  HeadphonesIcon,
  RouteIcon,
} from "lucide-react"

import { roomColors, roomGradient } from "@/components/adventures/room-colors"
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdventureByBookId } from "@/lib/adventures"
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
import { cn } from "@/lib/utils"

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
  const adventure = getAdventureByBookId(book.id)
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

  // Adventure books open in their room: the same colors and re-scoped theme
  // tokens as /adventures, ending in a hard seam above the purchase card.
  const room = adventure ? roomColors(adventure.palette) : undefined
  // Text over the band: the room's ink, or (on the softer wash) a muted ink
  // pulled toward the foreground so it stays readable over any cover color.
  const inkClass = room
    ? cn(room.tone === "dark" && "dark")
    : "[--muted-foreground:color-mix(in_oklab,var(--foreground)_85%,var(--background))]"
  const inkStyle = room ? (room.vars as React.CSSProperties) : undefined

  return (
    <article
      data-book-room={room ? room.tone : undefined}
      className="relative isolate overflow-x-clip"
      style={{ "--book": book.color.dominant } as React.CSSProperties}
    >
      {room ? null : (
        /* A small room: the cover's color washes the top, then fades out. */
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-136 bg-linear-to-b from-[color-mix(in_oklch,var(--book)_26%,var(--background))] via-[color-mix(in_oklch,var(--book)_12%,var(--background))] to-background dark:from-[color-mix(in_oklch,var(--book)_36%,var(--background))] dark:via-[color-mix(in_oklch,var(--book)_17%,var(--background))]"
        />
      )}

      <Container className="grid gap-x-10 gap-y-10 pb-16 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-x-16 lg:gap-y-12 xl:grid-cols-[20rem_minmax(0,1fr)] xl:gap-x-20">
        {room ? (
          /* Full-bleed band behind breadcrumb, cover (phones) and header. */
          <div
            aria-hidden="true"
            data-room-band=""
            className="-z-10 col-span-full row-[1/4] mx-[calc(50%-50vw)] lg:row-[1/3]"
            style={{ backgroundImage: roomGradient(room) }}
          />
        ) : null}

        <Breadcrumb
          className={cn(
            "col-span-full row-start-1 pt-6 text-foreground",
            inkClass
          )}
          style={inkStyle}
        >
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

        <div className="col-start-1 row-start-2 flex justify-center lg:sticky lg:top-28 lg:row-[2/4] lg:self-start lg:pt-2">
          <BookCover3D book={book} />
        </div>

        <header
          className={cn(
            "col-start-1 row-start-3 flex min-w-0 animate-in flex-col items-center gap-4 text-center text-foreground duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none lg:col-start-2 lg:row-start-2 lg:items-start lg:text-start",
            room && "pb-10 lg:pb-12",
            inkClass
          )}
          style={inkStyle}
        >
          <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
            <Badge variant="secondary" className="h-6 px-2.5">
              {isAudio ? (
                <HeadphonesIcon data-icon="inline-start" />
              ) : (
                <BookOpenTextIcon data-icon="inline-start" />
              )}
              {isAudio ? "کتاب صوتی" : "کتاب الکترونیکی"}
            </Badge>
            {book.free ? <Badge className="h-6 px-2.5">رایگان</Badge> : null}
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
          <p className="text-lg text-pretty text-foreground/90">
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
          {adventure ? (
            <Item
              variant="outline"
              render={<Link href={`/adventures/${book.id}`} />}
              className="mt-2 max-w-md border-foreground/25 text-start focus-visible:border-foreground focus-visible:ring-foreground/40"
            >
              <ItemMedia className="size-10 rounded-md bg-foreground text-background">
                <RouteIcon aria-hidden="true" className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-base">ورود به ماجرا</ItemTitle>
                <ItemDescription>{adventure.copy.tagline}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ArrowLeftIcon
                  aria-hidden="true"
                  className="size-5 transition-transform group-hover/item:-translate-x-1 motion-reduce:transition-none"
                />
              </ItemActions>
            </Item>
          ) : null}
        </header>

        <div className="col-start-1 row-start-4 flex min-w-0 flex-col gap-10 lg:col-start-2 lg:row-start-3">
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
