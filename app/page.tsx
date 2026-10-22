import { BookRow } from "@/components/book/book-row"
import { BookShelf } from "@/components/home/book-shelf"
import { CategoryStrip } from "@/components/home/category-strip"
import { PodcastsTeaser } from "@/components/home/podcasts-teaser"
import { Reveal } from "@/components/home/reveal"
import { pickShelfBooks } from "@/components/home/shelf-books"
import { SubscriptionTeaser } from "@/components/home/subscription-teaser"
import { Container } from "@/components/site/container"
import {
  getBooksByCategory,
  getCategories,
  getList,
  toSummary,
  type ListName,
} from "@/lib/catalog"
import { getPodcasts } from "@/lib/podcasts"

const STORE_ID = "store"

const rows: {
  list: ListName
  title: string
  description: string
  href?: string
}[] = [
  {
    list: "bestsellers",
    title: "پرفروش‌های ماه",
    description: "کتاب‌هایی که این ماه بیش از همه خوانده شده‌اند",
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

export default function Page() {
  const shelf = pickShelfBooks([
    getList("bestsellers"),
    getList("plus"),
    getList("audioBestsellers"),
    getList("newest"),
  ])

  const categories = getCategories().map((category) => ({
    slug: category.slug,
    title: category.title,
    count: getBooksByCategory(category.slug).length,
  }))

  const plusBooks = getList("plus").map(toSummary)

  const podcasts = getPodcasts()
    .slice(0, 5)
    .map(({ id, title, author, artwork }) => ({ id, title, author, artwork }))

  return (
    <>
      <BookShelf books={shelf} storeId={STORE_ID} />
      <Container
        id={STORE_ID}
        className="flex flex-col gap-16 pt-12 pb-20 md:gap-20"
      >
        <Reveal>
          <CategoryStrip categories={categories} />
        </Reveal>
        {rows.slice(0, 3).map((row) => (
          <Reveal key={row.list}>
            <BookRow
              title={row.title}
              description={row.description}
              href={row.href}
              books={getList(row.list).map(toSummary)}
            />
          </Reveal>
        ))}
        <Reveal>
          <SubscriptionTeaser covers={plusBooks.slice(0, 4)} />
        </Reveal>
        {rows.slice(3).map((row) => (
          <Reveal key={row.list}>
            <BookRow
              title={row.title}
              description={row.description}
              href={row.href}
              books={getList(row.list).map(toSummary)}
            />
          </Reveal>
        ))}
        <Reveal>
          <PodcastsTeaser podcasts={podcasts} />
        </Reveal>
      </Container>
    </>
  )
}
