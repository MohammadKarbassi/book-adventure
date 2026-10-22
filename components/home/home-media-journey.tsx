import Image from "next/image"
import Link from "next/link"
import { ArrowDownIcon, ArrowLeftIcon } from "lucide-react"
import { PlayButton } from "@/components/player/play-button"
import type { Track } from "@/components/player/types"
import { buttonVariants } from "@/components/ui/button"
import { HOME_POSTER } from "@/data/home-poster"

export type HomeMediaProps = { audio: Track; podcast: Track; storeId: string }

/** HOME only: accordion paper → independent podcast world → paper shop. */
export function HomeMediaJourney({ audio, podcast, storeId }: HomeMediaProps) {
  return (
    <div data-home-media="" className="relative">
      <section
        id="home-audio"
        data-home-media-phase="audio"
        aria-labelledby="home-audio-title"
        className="dark relative scroll-mt-16 bg-background text-foreground"
      >
        <div
          data-home-poster-flow=""
          className="relative flex min-h-[110svh] flex-col items-center justify-center gap-5 px-7 py-8"
        >
          <div
            data-home-poster-anchor=""
            data-poster-ready="false"
            data-poster-opening="1"
            className="relative aspect-[11/15] h-[min(88svh,116vw)] overflow-hidden font-heading md:h-[96svh]"
          >
            <Image
              data-home-poster-fallback=""
              src={HOME_POSTER.src}
              alt="پوستر ارسالی موشک آپولو با نوشتهٔ NASA"
              width={HOME_POSTER.sourceSize}
              height={HOME_POSTER.sourceSize}
              sizes="(min-width:768px) 40vw,70vw"
              className="absolute max-w-none"
              style={{
                width: `${(HOME_POSTER.sourceSize / HOME_POSTER.crop.width) * 100}%`,
                height: `${(HOME_POSTER.sourceSize / HOME_POSTER.crop.height) * 100}%`,
                left: `${(-HOME_POSTER.crop.x / HOME_POSTER.crop.width) * 100}%`,
                top: `${(-HOME_POSTER.crop.y / HOME_POSTER.crop.height) * 100}%`,
              }}
            />
          </div>
          <div className="relative z-20 flex max-w-xl flex-col items-center gap-3 text-center">
            <h2
              id="home-audio-title"
              className="font-heading text-2xl leading-tight md:text-4xl"
            >
              هر قصه، یک صدای تازه
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <PlayButton track={audio} label="شنیدن نمونهٔ رایگان" size="lg" />
              <Link
                href="/audiobooks"
                className={buttonVariants({ variant: "link" })}
              >
                کتاب‌های صوتی <ArrowLeftIcon data-icon="inline-end" />
              </Link>
            </div>
            <p className="max-w-lg text-xs leading-loose text-foreground/75">
              نمونهٔ آزاد برای تجربهٔ پخش؛ لزوماً صدای نسخهٔ اصلی «{audio.title}
              » نیست. منبع در پخش‌کننده آمده است.
            </p>
          </div>
        </div>
      </section>
      <div className="dark relative bg-background text-foreground">
        <div
          aria-hidden="true"
          data-home-podcast-background=""
          className="pointer-events-none sticky top-16 h-[calc(100svh-4rem)] overflow-hidden"
        >
          <Image
            src="/home-media/jupiter-provided.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-background/50" />
        </div>
        <section
          id="home-podcast"
          data-home-media-phase="podcast"
          aria-labelledby="home-podcast-title"
          className="relative z-20 -mt-[calc(100svh-4rem)] flex min-h-svh scroll-mt-16 flex-col items-center justify-center gap-6 px-7 py-16 text-center"
        >
          <div
            data-home-podcast-anchor=""
            className="relative size-[clamp(7rem,20svh,12rem)]"
          >
            <Image
              data-home-podcast-cover=""
              src={podcast.artwork}
              alt="کاور رسمی NASA’s Curious Universe"
              width={144}
              height={144}
              sizes="144px"
              className="h-full w-full rounded-md shadow-xl"
            />
          </div>
          <h2
            id="home-podcast-title"
            className="max-w-3xl font-heading text-5xl leading-tight md:text-7xl"
          >
            کنجکاوی، آن سوی صفحه‌ها
          </h2>
          <p dir="ltr" className="max-w-lg text-base">
            NASA’s Curious Universe
            <br />
            <span className="text-sm text-foreground/85">{podcast.title}</span>
          </p>
          <PlayButton track={podcast} label="شنیدن پادکست" size="lg" />
          <a
            href={podcast.href}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            منبع رسمی: ناسا · پادکست انگلیسی
          </a>
          <p className="max-w-lg text-xs leading-loose text-foreground/75">
            صدا و کاور: ناسا · تصویر فضایی ارسالی شما، مستقل از موضوع این قسمت
          </p>
        </section>
        <section
          data-home-shop-entrance=""
          aria-labelledby="home-shop-title"
          className="relative z-20 flex min-h-[65svh] flex-col items-center justify-center gap-7 bg-(--ending-paper) px-7 py-20 text-center text-(--ending-ink)"
        >
          <h2
            id="home-shop-title"
            className="max-w-3xl font-heading text-5xl leading-tight md:text-7xl"
          >
            کتاب بعدی‌تان را پیدا کنید
          </h2>
          <p className="max-w-xl text-lg leading-loose">
            حالا نوبت انتخاب شماست؛ قصه‌ای برای خواندن، شنیدن یا کشف کردن.
          </p>
          <a href={`#${storeId}`} className={buttonVariants({ size: "lg" })}>
            قدم به فروشگاه بگذارید <ArrowDownIcon data-icon="inline-end" />
          </a>
        </section>
      </div>
    </div>
  )
}
