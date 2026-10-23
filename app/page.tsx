import { BookRow } from "@/components/book/book-row"
import { BookShelf } from "@/components/home/book-shelf"
import { BookSpotlight } from "@/components/home/book-spotlight"
import { JourneyHero } from "@/components/home/journey-hero"
import { CategoryStrip } from "@/components/home/category-strip"
import { ForeignTeaser } from "@/components/home/foreign-teaser"
import { PodcastsTeaser } from "@/components/home/podcasts-teaser"
import { Reveal } from "@/components/home/reveal"
import { toShelfBook } from "@/components/home/shelf-books"
import { SubscriptionTeaser } from "@/components/home/subscription-teaser"
import { IntroOverlay } from "@/components/intro/intro-overlay"
import { Container } from "@/components/site/container"
import { sortBooks } from "@/lib/browse"
import {
  getAllBooks,
  getBook,
  getBooksByCategory,
  getCategories,
  getCategory,
  getList,
  toSummary,
  type ListName,
} from "@/lib/catalog"
import { isFeatureSafe } from "@/lib/feature-safe"
import { formatNumber } from "@/lib/format"
import { getPodcasts } from "@/lib/podcasts"
import {
  getAdventureByBookId,
  getAdventures,
  getBookPalette,
} from "@/lib/adventures"
import { getCategoryMap } from "@/components/adventures/adventure-views"
import { HOME_NASA_SAMPLE, HOME_PODCAST } from "@/data/home-podcast"

const STORE_ID = "store"

/** Store sections read like chapters of one book: «فصل ۱», «فصل ۲»… The two
 * card teasers (subscription, foreign) are interludes without a number. */
const chapter = (n: number) => `فصل ${formatNumber(n)}`

const rows: {
  list: ListName
  title: string
  description: string
  href?: string
  /** Top-10 row with rank numerals. */
  ranked?: boolean
}[] = [
  {
    list: "bestsellers",
    title: "پرفروش‌های ماه",
    description: "کتاب‌هایی که این ماه بیش از همه خوانده شده‌اند",
    ranked: true,
  },
  {
    list: "newest",
    title: "تازه‌ها",
    description: "تازه‌ترین کتاب‌هایی که به قفسه‌های ما رسیده‌اند",
  },
  {
    list: "discounted",
    title: "تخفیف‌های ویژه",
    description: "کتاب‌های خوب، این روزها با قیمتی کمتر",
  },
  {
    list: "audioBestsellers",
    title: "کتاب‌های صوتی پرفروش",
    description: "برای راه، آشپزخانه و پیش از خواب",
    href: "/audiobooks",
  },
  {
    list: "plus",
    title: "با اشتراک بخوانید",
    description: "همهٔ این کتاب‌ها با یک اشتراک در دسترس شماست",
    href: "/subscription",
  },
]

function renderRow(row: (typeof rows)[number], chapterNumber: number) {
  const books = getList(row.list).filter(isFeatureSafe).map(toSummary)
  return (
    <BookRow
      key={row.list}
      eyebrow={chapter(chapterNumber)}
      title={row.title}
      description={row.description}
      href={row.href}
      ranked={row.ranked}
      books={row.ranked ? books.slice(0, 10) : books}
    />
  )
}

/** «سمفونی مردگان» (Abbas Maroufi): the shop's editorial pick. It has no
 * adventure of its own, so the shop shows a room the journey doesn't. */
const SPOTLIGHT_ID = 1631

/** The spotlight book, falling back to the most loved e-book without an
 * adventure if the pick ever leaves the catalog. */
function getSpotlight() {
  const book =
    getBook(SPOTLIGHT_ID) ??
    getAllBooks()
      .filter(
        (book) =>
          book.type === "ebook" &&
          book.description.length > 0 &&
          isFeatureSafe(book) &&
          !getAdventureByBookId(book.id)
      )
      .sort((a, b) => b.rating * b.ratingsCount - a.rating * a.ratingsCount)[0]
  if (!book) return null
  const category = getCategory(book.categorySlug)
  return {
    book: toSummary(book),
    palette: getBookPalette(book),
    excerpt: book.description[0],
    category: category && { slug: category.slug, title: category.title },
  }
}

export default function Page() {
  const shelf = getAdventures().map(toShelfBook)

  const categories = getCategories().map((category) => {
    const books = getBooksByCategory(category.slug)
    return {
      slug: category.slug,
      title: category.title,
      count: books.length,
      covers: sortBooks(books, "popular")
        .filter(isFeatureSafe)
        .slice(0, 3)
        .map(toSummary),
    }
  })

  const spotlight = getSpotlight()

  const plusBooks = getList("plus").map(toSummary)

  const podcasts = getPodcasts()
    .slice(0, 5)
    .map(({ id, title, author, artwork }) => ({ id, title, author, artwork }))

  return (
    <>
      <IntroOverlay />
      <JourneyHero />
      <BookShelf
        books={shelf}
        categoryOf={getCategoryMap()}
        storeId={STORE_ID}
        media={{ audio: HOME_NASA_SAMPLE, podcast: HOME_PODCAST }}
      />
      {/* Native opaque paper covers the fixed canvas even when compositor
          scrolling gets ahead of its RAF-driven clip. Keep this full bleed. */}
      <div data-home-store-surface="" className="relative z-20 overflow-x-clip bg-background">
        <Container
          id={STORE_ID}
          className="flex flex-col gap-16 pt-12 pb-20 md:gap-20"
        >
          <Reveal>
            <CategoryStrip categories={categories} eyebrow={chapter(1)} />
          </Reveal>
          {/* Rows animate their own header and cards (see BookRow), so they
              are not wrapped in Reveal. */}
          {renderRow(rows[0], 2)}
          {spotlight ? (
            <Reveal>
              <BookSpotlight {...spotlight} eyebrow={chapter(3)} />
            </Reveal>
          ) : null}
          {rows.slice(1, 3).map((row, index) => renderRow(row, index + 4))}
          <Reveal>
            <SubscriptionTeaser covers={plusBooks.slice(0, 4)} />
          </Reveal>
          {rows.slice(3).map((row, index) => renderRow(row, index + 6))}
          <Reveal>
            <PodcastsTeaser podcasts={podcasts} eyebrow={chapter(8)} />
          </Reveal>
          <Reveal>
            <ForeignTeaser />
          </Reveal>
        </Container>
      </div>
    </>
  )
}
