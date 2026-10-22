import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeftIcon,
  ArrowUpIcon,
  HeadphonesIcon,
  PodcastIcon,
} from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import type { AdventureView } from "@/components/adventures/adventure-types"
import { cn } from "@/lib/utils"

export type EndingPodcast = { id: string; title: string; artwork: string }

/** Project adaptation of the reference's book → media → footer sequence.
 * No Stripe film, artwork or copy is reproduced. The entering DOM surface
 * and the book-canvas clipping share the same measured viewport boundary. */
export function JourneyEnding({
  audio,
  podcast,
}: {
  audio?: AdventureView
  podcast?: EndingPodcast
}) {
  return (
    <section
      data-journey-ending=""
      aria-labelledby="journey-ending-title"
      className="relative z-20 bg-background text-foreground"
    >
      <div className="mx-auto flex min-h-svh max-w-7xl flex-col justify-center gap-12 px-7 py-24 min-[900px]:px-28">
        <h2
          id="journey-ending-title"
          className="max-w-xl font-heading text-5xl leading-tight min-[900px]:text-7xl"
        >
          قصه هنوز ادامه دارد.
        </h2>
        <div className="grid gap-12 min-[900px]:grid-cols-2 min-[900px]:gap-20">
          <div className="flex items-center gap-6">
            {audio ? (
              <Image
                src={`/adventure-covers/${audio.id}.webp`}
                alt={audio.book.title}
                width={128}
                height={192}
                className="w-24 -rotate-6 rounded-sm shadow-xl min-[900px]:w-32"
              />
            ) : (
              <HeadphonesIcon aria-hidden="true" className="size-20" />
            )}
            <div className="flex flex-col items-start gap-4">
              <h3 className="font-heading text-3xl">این بار، گوش بسپارید</h3>
              <p className="max-w-64 text-sm leading-loose text-muted-foreground">
                سفر بعدی می‌تواند با یک صدا شروع شود؛ در راه، در خانه، یا پیش از
                خواب.
              </p>
              <Link
                href="/audiobooks"
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "px-0 text-foreground"
                )}
              >
                کتاب‌های صوتی
                <ArrowLeftIcon data-icon="inline-end" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {podcast ? (
              <Image
                src={podcast.artwork}
                alt={podcast.title}
                width={144}
                height={144}
                className="aspect-square w-24 rotate-3 rounded-sm shadow-xl min-[900px]:w-32"
              />
            ) : (
              <PodcastIcon aria-hidden="true" className="size-20" />
            )}
            <div className="flex flex-col items-start gap-4">
              <h3 className="font-heading text-3xl">یک روایت دیگر</h3>
              <p className="max-w-64 text-sm leading-loose text-muted-foreground">
                برای کنجکاوی‌هایی که با آخرین صفحه تمام نمی‌شوند.
              </p>
              <Link
                href="/podcasts"
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "px-0 text-foreground"
                )}
              >
                پادکست‌ها
                <ArrowLeftIcon data-icon="inline-end" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 border-t border-foreground/20 px-7 py-12 min-[900px]:px-28">
        <p className="font-heading text-3xl">ماجراجویی با کتاب</p>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "bg-transparent"
          )}
        >
          <ArrowUpIcon data-icon="inline-start" />
          بازگشت به قفسه
        </Link>
      </footer>
    </section>
  )
}
