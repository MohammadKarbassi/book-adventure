import Link from "next/link"
import { ArrowLeftIcon, LanguagesIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FOREIGN_SUBJECTS } from "@/lib/foreign"
import { cn } from "@/lib/utils"
import { BookCover } from "@/components/book/book-cover"
import { BookTravelLink } from "@/components/book/book-travel-link"

// Small curated snapshot of recorded Open Library search results, not a live
// request or test-fixture dependency. Detail pages still resolve current data.
const previews = [
  {
    workId: "OL8400950W",
    title: "The Blade Itself",
    author: "Joe Abercrombie",
    cover: 14543422,
  },
  {
    workId: "OL5738154W",
    title: "The Hero of Ages",
    author: "Brandon Sanderson",
    cover: 14658094,
  },
  {
    workId: "OL8369445W",
    title: "The Lies of Locke Lamora",
    author: "Scott Lynch",
    cover: 6307636,
  },
] as const

// Static on purpose: the home page never calls Open Library.
export function ForeignTeaser() {
  return (
    <Card
      role="region"
      aria-labelledby="foreign-heading"
      className="relative gap-0 overflow-hidden py-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-radial-[circle_at_0%_100%] from-accent/50 to-transparent to-60%"
      />
      <div className="relative grid gap-8 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:py-10">
        <div className="min-w-0">
          <CardHeader className="w-full gap-2 px-6 md:px-10">
            <span className="flex size-10 items-center justify-center rounded-s-sm rounded-e-lg bg-accent text-accent-foreground shadow-sm">
              <LanguagesIcon className="size-5" />
            </span>
            <CardTitle className="mt-2 text-3xl font-bold md:text-4xl">
              <h2 id="foreign-heading">کتاب‌های خارجی، به زبان اصلی</h2>
            </CardTitle>
            <CardDescription className="text-base/relaxed text-pretty">
              از کتابخانهٔ باز Open Library: رمان‌های فانتزی و علمی‌تخیلی،
              معماهای جنایی، کلاسیک‌ها، تاریخ و فلسفه. هر کتاب را مثل بقیهٔ
              قفسه‌ها بخرید یا نشان کنید؛ در کتابخانهٔ شما کنار کتاب‌های فارسی
              می‌ماند.
            </CardDescription>
            <ul
              aria-label="قفسه‌ها"
              className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground"
            >
              {FOREIGN_SUBJECTS.map((subject) => (
                <li
                  key={subject.slug}
                  className="after:ms-3 after:content-['·'] last:after:content-none"
                >
                  {subject.title}
                </li>
              ))}
            </ul>
          </CardHeader>
          <CardFooter className="mt-6 border-0 bg-transparent px-6 py-0 md:px-10">
            <Link
              href="/foreign"
              className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
            >
              دیدن کتاب‌های خارجی
              <ArrowLeftIcon data-icon="inline-end" />
            </Link>
          </CardFooter>
        </div>
        <ul
          aria-label="پیش‌نمایش کتاب‌های خارجی"
          className="grid min-w-0 grid-cols-3 items-start gap-4 px-6 py-6 md:gap-5 md:ps-0 md:pe-10"
        >
          {previews.map((book) => (
            <li key={book.workId} className="min-w-0">
              <BookTravelLink
                href={`/foreign/${book.workId}`}
                className="group/preview flex flex-col gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div
                  dir="ltr"
                  className="origin-left transition-transform duration-300 ease-out group-hover/preview:[transform:perspective(900px)_rotateY(9deg)_translateY(-6px)] motion-reduce:transition-none motion-reduce:group-hover/preview:transform-none"
                >
                  <BookCover
                    book={{
                      title: book.title,
                      image: `https://covers.openlibrary.org/b/id/${book.cover}-L.jpg`,
                    }}
                    sizes="(min-width: 768px) 180px, 28vw"
                    className="w-full"
                  />
                </div>
                <span dir="ltr" className="line-clamp-2 text-sm font-medium">
                  {book.title}
                </span>
                <span
                  dir="ltr"
                  className="line-clamp-2 text-xs text-muted-foreground"
                >
                  {book.author}
                </span>
              </BookTravelLink>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
