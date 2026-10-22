"use client"

import { useRef } from "react"
import Link from "next/link"
import {
  ArrowDownIcon,
  ArrowRightIcon,
  BackpackIcon,
  CloudSunIcon,
  CompassIcon,
  GaugeIcon,
  QuoteIcon,
  ShapesIcon,
  TimerIcon,
} from "lucide-react"

import { AdventureActions } from "@/components/adventures/adventure-actions"
import { AdventureBook3D } from "@/components/adventures/adventure-book-3d"
import { AdventureRoute } from "@/components/adventures/adventure-route"
import type { AdventureView } from "@/components/adventures/adventure-types"
import { JourneyNote } from "@/components/adventures/journey-note"
import { SectionLabel } from "@/components/adventures/section-label"
import { RatingStars } from "@/components/book/rating-stars"
import { Container } from "@/components/site/container"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { formatDuration, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const DIFFICULTY = { 1: "آسان", 2: "متوسط", 3: "دشوار" } as const

const join = (names?: string[]) => (names?.length ? names.join("، ") : "")

type AdventureSectionProps = {
  adventure: AdventureView
  /** 0-based position in the displayed order. */
  index: number
  total: number
  reduced: boolean
  /** Show «بر اساس علاقه‌مندی‌های شما» under the eyebrow. */
  personalized: boolean
  next?: AdventureView
  onNext: () => void
  showHint: boolean
  onFirstTurn: () => void
  priority: boolean
}

const factClass = "border-foreground/15 bg-foreground/[0.04]"

/** Room colors: the gradient and the theme tokens re-scoped to the room. */
const roomStyle = ({ room }: AdventureView) =>
  ({
    ...room.vars,
    backgroundImage: `linear-gradient(to bottom, ${room.top}, ${room.bottom})`,
  }) as React.CSSProperties

/**
 * One adventure as a full-color room: the sticky 3D book beside its story,
 * route, trip facts, gear and purchase table, then «همسفران» across the
 * full width and the way on to the next room.
 */
export function AdventureSection({
  adventure,
  index,
  total,
  reduced,
  personalized,
  next,
  onNext,
  showHint,
  onFirstTurn,
  priority,
}: AdventureSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const { book, room } = adventure
  const number = index + 1
  const key = `adventure-${adventure.id}`
  const isAudio = book.type === "audiobook"

  return (
    <section
      ref={sectionRef}
      id={key}
      data-adventure-section={adventure.id}
      data-category={adventure.categorySlug}
      data-tone={room.tone}
      aria-labelledby={`${key}-name`}
      className={cn("relative text-foreground", room.tone === "dark" && "dark")}
      style={roomStyle(adventure)}
    >
      <Container className="grid gap-x-12 pb-16 lg:min-h-svh lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:ps-24 lg:pb-[16svh] xl:gap-x-20 xl:ps-28">
        {/* The book: above the text on small screens, sticky beside it on large ones. */}
        <div className="flex justify-center pt-10 pb-8 lg:sticky lg:top-0 lg:col-start-2 lg:row-start-1 lg:h-svh lg:items-center lg:self-start lg:py-0">
          <AdventureBook3D
            adventure={adventure}
            number={number}
            reduced={reduced}
            sectionRef={sectionRef}
            showHint={showHint}
            onFirstTurn={onFirstTurn}
            priority={priority}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-11 lg:col-start-1 lg:row-start-1 lg:pt-[20svh]">
          <header className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CompassIcon aria-hidden="true" className="size-3.5" />
                {`ماجراجویی ${formatNumber(number)} از ${formatNumber(total)}`}
              </p>
              {index === 0 ? <JourneyNote show={personalized} /> : null}
            </div>
            <div className="flex flex-col gap-2">
              <h2
                id={`${key}-name`}
                className="font-heading text-[2.15rem] leading-[1.15] font-bold text-balance sm:text-[2.5rem]"
              >
                {adventure.name}
              </h2>
              <p className="font-heading text-lg leading-snug text-pretty text-foreground/85">
                {adventure.tagline}
              </p>
            </div>
            <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
              {`بر اساس «${book.title}» اثر ${join(book.authors) || "نویسنده‌ای ناشناس"}`}
              {isAudio && book.narrators?.length
                ? `، با صدای ${join(book.narrators)}`
                : null}
            </p>
            <span aria-hidden="true" className="h-px w-14 bg-foreground/50" />
          </header>

          <div className="flex max-w-prose flex-col gap-4">
            {adventure.story.map((paragraph, paragraphIndex) => (
              <p
                key={paragraphIndex}
                className="text-[0.95rem] leading-[2] text-pretty"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <AdventureRoute stops={adventure.route} headingId={`${key}-route`} />

          <ItemGroup
            aria-label="مشخصات سفر"
            className="grid gap-2.5 sm:grid-cols-2"
          >
            {adventure.tripSeconds ? (
              <Item
                role="listitem"
                variant="outline"
                size="sm"
                className={factClass}
              >
                <ItemMedia variant="icon">
                  <TimerIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription className="text-xs">مدت سفر</ItemDescription>
                  <ItemTitle className="line-clamp-none">
                    {isAudio
                      ? formatDuration(adventure.tripSeconds)
                      : `حدود ${formatDuration(adventure.tripSeconds)} خواندن`}
                  </ItemTitle>
                </ItemContent>
              </Item>
            ) : null}
            <Item
              role="listitem"
              variant="outline"
              size="sm"
              className={factClass}
            >
              <ItemMedia variant="icon">
                <GaugeIcon />
              </ItemMedia>
              <ItemContent>
                <ItemDescription className="text-xs">سختی مسیر</ItemDescription>
                <ItemTitle>
                  <span
                    role="img"
                    aria-label={`${formatNumber(adventure.difficulty)} از ۳`}
                    className="flex gap-1"
                  >
                    {[1, 2, 3].map((level) => (
                      <span
                        key={level}
                        className={cn(
                          "size-2 rounded-full",
                          level <= adventure.difficulty
                            ? "bg-foreground"
                            : "bg-foreground/20"
                        )}
                      />
                    ))}
                  </span>
                  {DIFFICULTY[adventure.difficulty]}
                </ItemTitle>
              </ItemContent>
            </Item>
            {book.moods.length > 0 ? (
              <Item
                role="listitem"
                variant="outline"
                size="sm"
                className={factClass}
              >
                <ItemMedia variant="icon">
                  <CloudSunIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription className="text-xs">
                    حال‌وهوا
                  </ItemDescription>
                  <span className="flex flex-wrap gap-1.5">
                    {book.moods.map((mood) => (
                      <Badge
                        key={mood}
                        variant="outline"
                        className="border-foreground/25"
                      >
                        {mood}
                      </Badge>
                    ))}
                  </span>
                </ItemContent>
              </Item>
            ) : null}
            {book.categoryTitle ? (
              <Item
                role="listitem"
                variant="outline"
                size="sm"
                className={factClass}
              >
                <ItemMedia variant="icon">
                  <ShapesIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemDescription className="text-xs">گونه</ItemDescription>
                  <ItemTitle>
                    <Link
                      href={`/category/${book.categorySlug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {book.categoryTitle}
                    </Link>
                  </ItemTitle>
                </ItemContent>
              </Item>
            ) : null}
          </ItemGroup>

          <section
            aria-labelledby={`${key}-gear`}
            className="flex flex-col gap-4"
          >
            <SectionLabel id={`${key}-gear`}>
              <BackpackIcon aria-hidden="true" className="size-4.5" />
              توشهٔ سفر
            </SectionLabel>
            <ul className="flex flex-col gap-2">
              {adventure.gear.map((item, gearIndex) => (
                <li
                  key={gearIndex}
                  className="flex gap-3 text-[0.95rem] leading-loose text-pretty"
                >
                  <span
                    aria-hidden="true"
                    className="mt-3 size-1.5 shrink-0 rotate-45 bg-foreground/60"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <AdventureActions adventure={adventure} />
        </div>
      </Container>

      {adventure.reviews.length > 0 ? (
        <Container className="lg:ps-24 xl:ps-28">
          <section
            aria-labelledby={`${key}-reviews`}
            className="flex flex-col gap-9 pb-16"
          >
            <SectionLabel id={`${key}-reviews`}>همسفران</SectionLabel>
            <ul className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {adventure.reviews.map((review, reviewIndex) => (
                <li key={reviewIndex}>
                  <figure className="flex flex-col gap-3">
                    <QuoteIcon
                      aria-hidden="true"
                      className="size-6 fill-current stroke-0 text-foreground/80"
                    />
                    <blockquote className="text-sm leading-7 text-pretty">
                      {review.text}
                    </blockquote>
                    <span
                      aria-hidden="true"
                      className="h-px w-6 bg-foreground/40"
                    />
                    <figcaption className="flex flex-col gap-0.5 text-sm">
                      <span className="font-medium">{review.user}</span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        خوانندهٔ فیدیبو
                        <RatingStars rating={review.rating} />
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <Link
              href={`/book/${book.id}`}
              className={cn(
                buttonVariants({ variant: "link" }),
                "self-start px-0 text-foreground"
              )}
            >
              {`همهٔ نظرها (${formatNumber(adventure.reviewsCount)})`}
            </Link>
          </section>
        </Container>
      ) : null}

      <Container className="pb-[14svh] lg:ps-24 xl:ps-28">
        <div className="border-t border-foreground/20 pt-8">
          {next ? (
            <Button
              variant="outline"
              size="lg"
              onClick={onNext}
              className="h-auto min-h-11 max-w-full justify-start border-foreground/30 bg-transparent px-4 py-2.5 text-start whitespace-normal"
            >
              <ArrowDownIcon data-icon="inline-start" />
              {`ماجراجویی بعدی: ${next.name}`}
            </Button>
          ) : (
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 border-foreground/30 bg-transparent px-4"
              )}
            >
              <ArrowRightIcon data-icon="inline-start" />
              بازگشت به قفسه
            </Link>
          )}
        </div>
      </Container>
    </section>
  )
}
