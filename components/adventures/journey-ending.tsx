import Image from "next/image"
import Link from "next/link"
import { ArrowLeftIcon, ArrowUpIcon, HeadphonesIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { PlayButton } from "@/components/player/play-button"
import type { AdventureView } from "@/components/adventures/adventure-types"
import { endingPicks } from "@/components/adventures/ending-picks"
import { BookCover } from "@/components/book/book-cover"
import { cn } from "@/lib/utils"

export type EndingPodcast = { id: string; title: string; artwork: string }

/** Native content and the paper footer pass over one sticky image.
 * Project adaptation, not a claim about Stripe's animation technology. */
export function JourneyEnding({
  audio,
  podcast,
  adventures = [],
  onSelect,
}: {
  audio?: AdventureView
  podcast?: EndingPodcast
  /** The journey in its displayed order; the last one was just finished. */
  adventures?: AdventureView[]
  /** Scrolls the journey back to a room instead of reloading the route. */
  onSelect?: (id: number) => void
}) {
  const { others, category } = endingPicks(adventures)
  return (
    <section
      data-journey-ending=""
      aria-labelledby="journey-ending-title"
      className="relative isolate z-40"
    >
      <div
        data-listening-backdrop=""
        aria-hidden="true"
        className="dark pointer-events-none sticky top-0 h-svh overflow-hidden bg-background"
      >
        <Image
          src="/hero/book-journey.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-background/60" />
      </div>
      <div className="dark relative z-10 -mt-[100svh] text-foreground">
        <div className="mx-auto grid min-h-svh max-w-7xl items-center gap-12 px-7 py-20 min-[900px]:grid-cols-[1.1fr_1fr] min-[900px]:gap-20 min-[900px]:px-28 min-[900px]:py-28">
          <div className="flex flex-col items-start gap-6">
            <h2
              id="journey-ending-title"
              className="max-w-lg font-heading text-6xl leading-tight min-[900px]:text-8xl"
            >
              سفر را بشنوید
            </h2>
            <p className="max-w-md text-lg leading-loose text-foreground/85">
              گاهی راه از آخرین صفحه ادامه پیدا می‌کند؛ با صدایی که در مسیر، در
              خانه یا پیش از خواب همراهتان می‌ماند.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {audio?.track ? (
                <PlayButton
                  track={audio.track}
                  label="شنیدن نمونهٔ رایگان"
                  size="lg"
                />
              ) : null}
              <Link
                href="/audiobooks"
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "px-0 text-foreground"
                )}
              >
                کتاب‌های صوتی <ArrowLeftIcon data-icon="inline-end" />
              </Link>
            </div>
            {audio?.track ? (
              <p className="max-w-md text-xs leading-loose text-foreground/75">
                این صدا نمونه‌ای آزاد برای تجربهٔ پخش است، نه صدای نسخهٔ اصلی «
                {audio.book.title}». مشخصات و منبع صدا در پخش‌کننده آمده است.
              </p>
            ) : null}
          </div>
          <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-8">
            {audio ? (
              <Link
                href={`/book/${audio.id}`}
                aria-label={`دیدن کتاب ${audio.book.title}`}
                className="block w-44 outline-none focus-visible:ring-3 focus-visible:ring-ring min-[900px]:w-64"
              >
                <Image
                  src={`/adventure-covers/${audio.id}.webp`}
                  alt={audio.book.title}
                  width={360}
                  height={540}
                  sizes="(min-width:900px) 256px,176px"
                  className="h-auto w-full [transform:perspective(1000px)_rotateY(-14deg)_rotateZ(-5deg)] rounded-s-sm rounded-e-md shadow-2xl"
                />
              </Link>
            ) : (
              <HeadphonesIcon aria-hidden="true" className="size-32" />
            )}
            {audio ? (
              <p className="text-center font-heading text-3xl">
                {audio.book.title}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-foreground/25 pt-8 min-[900px]:col-span-2">
            <div className="flex items-center gap-4">
              {podcast ? (
                <Image
                  src={podcast.artwork}
                  alt=""
                  width={64}
                  height={64}
                  className="size-14 rounded-sm object-cover"
                />
              ) : null}
              <div>
                <p className="font-heading text-2xl">
                  یک روایت دیگر، یک همسفر تازه
                </p>
                <p className="mt-1 text-sm text-foreground/75">
                  {podcast ? podcast.title : "روایت‌هایی برای ادامهٔ کنجکاوی"}
                </p>
              </div>
            </div>
            <Link
              href="/podcasts"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "bg-transparent text-foreground"
              )}
            >
              پادکست‌ها <ArrowLeftIcon data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </div>
      <footer
        data-journey-paper=""
        className="relative z-20 bg-(--ending-paper) text-(--ending-ink)"
      >
        <div className="mx-auto flex min-h-[75svh] max-w-7xl flex-col items-start justify-center gap-8 px-7 py-24 min-[900px]:px-28">
          <h2 className="max-w-3xl font-heading text-5xl leading-tight min-[900px]:text-7xl">
            سفر بعدی‌تان از کدام کتاب شروع می‌شود؟
          </h2>
          <p className="max-w-lg text-lg leading-loose">
            به قفسه برگردید؛ شاید قصه‌ای که این بار دنبالش هستید، همان‌جا
            منتظرتان باشد.
          </p>
          <Link
            href="/#adventure-shelf"
            className={cn(buttonVariants({ size: "lg" }), "mt-2")}
          >
            <ArrowUpIcon data-icon="inline-start" />
            بازگشت به قفسه
          </Link>
          <Link
            href="/#store"
            className="text-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            یا در فروشگاه کتاب‌ها بگردید
          </Link>
          {others.length > 0 ? (
            <nav
              aria-labelledby="journey-others-title"
              className="mt-6 flex w-full max-w-4xl flex-col gap-5 border-t border-(--ending-ink)/15 pt-8"
            >
              <h3
                id="journey-others-title"
                className="font-heading text-3xl leading-tight"
              >
                سفرهای دیگر
              </h3>
              <ul className="grid gap-5 sm:grid-cols-3">
                {others.map((adventure) => (
                  <li key={adventure.id}>
                    <Link
                      href={`/adventures/${adventure.id}`}
                      onClick={(event) => {
                        if (
                          !onSelect ||
                          event.metaKey ||
                          event.ctrlKey ||
                          event.shiftKey ||
                          event.altKey
                        )
                          return
                        event.preventDefault()
                        onSelect(adventure.id)
                      }}
                      className="group flex items-center gap-4 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring"
                    >
                      <BookCover
                        book={adventure.book}
                        size="sm"
                        className="ring-(--ending-ink)/10 transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none"
                      />
                      <span className="flex min-w-0 flex-col gap-1">
                        <span className="font-heading text-xl leading-snug group-hover:underline group-hover:underline-offset-4">
                          {adventure.name}
                        </span>
                        <span className="line-clamp-1 text-sm text-(--ending-ink)/75">
                          {adventure.book.title}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {category ? (
                <Link
                  href={`/category/${category.slug}`}
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "self-start px-0 text-(--ending-ink)"
                  )}
                >
                  {`ادامه در فروشگاه: ${category.title}`}
                  <ArrowLeftIcon data-icon="inline-end" />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </footer>
    </section>
  )
}
