"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react"
import { ChevronDownIcon, HeadphonesIcon, PodcastIcon } from "lucide-react"

import { JourneyNote } from "@/components/adventures/journey-note"
import type { CategoryMap } from "@/components/adventures/journey-order"
import { useJourneyOrder } from "@/components/adventures/use-journey-order"
import { ShelfBook } from "@/components/home/shelf-book"
import { lampShare } from "@/components/home/shelf-dusk"
import { ShelfScene } from "@/components/home/shelf-scene"
import {
  HomeMediaJourney,
  type HomeMediaProps,
} from "@/components/home/home-media-journey"
import type { ShelfBook as ShelfBookData } from "@/components/home/shelf-geometry"
import { Container } from "@/components/site/container"
import { buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/format"
import { useHydrated } from "@/lib/store"
import { cn } from "@/lib/utils"

type BookShelfProps = {
  /** The adventures, in their default order. */
  books: ShelfBookData[]
  /** bookId → categorySlug, to order the adventures by the reader's interests. */
  categoryOf: CategoryMap
  /** Id of the element the scroll cue jumps to. */
  storeId: string
  media: Omit<HomeMediaProps, "storeId">
}

const railLinks = [
  {
    href: "#home-audio",
    phase: "audio",
    label: "رفتن به صحنهٔ کتاب صوتی",
    icon: HeadphonesIcon,
  },
  {
    href: "#home-podcast",
    phase: "podcast",
    label: "رفتن به صحنهٔ پادکست",
    icon: PodcastIcon,
  },
]

/** «سفر ماجراجویی شما»: a scroll-tilted stack of the adventures. */
export function BookShelf({
  books: defaultBooks,
  categoryOf,
  storeId,
  media,
}: BookShelfProps) {
  const { items: books, personalized } = useJourneyOrder(
    defaultBooks,
    categoryOf
  )
  const listRef = useRef<HTMLOListElement>(null)
  const [shelfInView, setShelfInView] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [phase, setPhase] = useState("books")
  const [dimmed, setDimmed] = useState(false)
  // The night stage sits under the sticky site header.
  const [night, setNight] = useState(false)
  // The shop entrance is coming up: the rail steps aside.
  const [railAway, setRailAway] = useState(false)
  // useReducedMotion reads matchMedia on the client only; wait for hydration
  // so the first client render matches the server.
  const prefersReduced = useReducedMotion()
  const reduced = useHydrated() && prefersReduced === true

  // The book nearest the middle of the viewport is the "current" one.
  const { scrollY } = useScroll()
  const updateActive = useCallback(() => {
    const mediaSections = document.querySelectorAll<HTMLElement>(
      "[data-home-media-phase], [data-home-shop-entrance]"
    )
    let currentPhase = "books"
    mediaSections.forEach((section) => {
      const bounds = section.getBoundingClientRect()
      if (bounds.top < innerHeight * 0.5 && bounds.bottom > innerHeight * 0.5)
        currentPhase = section.dataset.homeMediaPhase ?? "paper"
    })
    setPhase(currentPhase)
    const entranceTop = document
      .querySelector("[data-home-shop-entrance]")
      ?.getBoundingClientRect().top
    setRailAway(entranceTop !== undefined && entranceTop < innerHeight * 0.85)
    const store = document.getElementById(storeId)
    const shelfTop = listRef.current
      ?.closest("section")
      ?.getBoundingClientRect().top
    if (store)
      setShelfInView(
        shelfTop !== undefined &&
          shelfTop < window.innerHeight / 2 &&
          store.getBoundingClientRect().top > 81
      )
    const items = listRef.current?.children
    if (!items?.length) {
      setNight(false)
      return
    }
    const last = items[items.length - 1].getBoundingClientRect()
    const dim = Math.max(
      0,
      Math.min(1, (innerHeight * 1.6 - last.top) / (innerHeight * 1.1))
    )
    const shelf = listRef.current?.closest<HTMLElement>("[data-press-shelf]")
    shelf?.style.setProperty("--shelf-dim", `${dim * 100}%`)
    shelf?.style.setProperty("--shelf-lamp", `${lampShare(dim) * 100}%`)
    setDimmed(dim > 0.5)
    // Night under the header (64px) until the paper entrance reaches it.
    setNight(
      dim > 0.5 &&
        entranceTop !== undefined &&
        entranceTop > 64 &&
        (shelf?.getBoundingClientRect().top ?? 0) < 64
    )
    const middle = window.innerHeight / 2
    let nearest = 0
    let nearestDistance = Infinity
    for (let index = 0; index < items.length; index++) {
      const rect = items[index].getBoundingClientRect()
      const distance = Math.abs(rect.top + rect.height / 2 - middle)
      if (distance < nearestDistance) {
        nearest = index
        nearestDistance = distance
      }
    }
    setActiveIndex(nearest)
  }, [storeId])
  useMotionValueEvent(scrollY, "change", updateActive)
  // A page-level flag the header's CSS reads; cleared when leaving home.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-home-night", night)
  }, [night])
  useEffect(
    () => () => document.documentElement.removeAttribute("data-home-night"),
    []
  )
  useEffect(() => {
    const frame = requestAnimationFrame(updateActive)
    window.addEventListener("resize", updateActive)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", updateActive)
    }
  }, [updateActive])

  const scrollBehavior = (): ScrollBehavior => (reduced ? "auto" : "smooth")

  function showBook(index: number) {
    const item = listRef.current?.querySelector<HTMLElement>(
      `[data-shelf-index="${index}"]`
    )
    if (!item) return
    item.scrollIntoView({ block: "center", behavior: scrollBehavior() })
    item.querySelector("a")?.focus({ preventScroll: true })
  }

  function goToStore(event: React.MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(storeId)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ block: "start", behavior: scrollBehavior() })
  }

  return (
    <section
      id="adventure-shelf"
      aria-labelledby="shelf-heading"
      data-press-shelf=""
      data-shelf-in-view={shelfInView ? "true" : "false"}
      data-home-phase={phase}
      // Background: the dusk mix in app/globals.css ([data-press-shelf]).
      className="relative isolate min-h-svh overflow-x-clip bg-background text-foreground"
    >
      <ShelfScene books={books} />
      {/* Index rail at the binding (inline-start) edge. */}
      <nav
        aria-label="فهرست قفسه"
        className={cn(
          "absolute inset-y-0 start-3 z-30 hidden w-10 text-foreground transition-[opacity,visibility] duration-240 motion-reduce:transition-none md:block lg:start-6",
          railAway && "invisible opacity-0",
          (phase === "audio" ||
            phase === "podcast" ||
            (phase === "books" && dimmed)) &&
            "dark"
        )}
      >
        <div className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6">
          <ol className="flex flex-col items-center">
            {books.map((book, index) => {
              const current = phase === "books" && index === activeIndex
              const label = `ماجراجویی ${formatNumber(index + 1)} · ${book.name}`
              return (
                <li key={book.id}>
                  <Tooltip>
                    <TooltipTrigger
                      aria-label={label}
                      aria-current={current ? "true" : undefined}
                      onClick={() => showBook(index)}
                      className="group/tick flex h-4 w-10 items-center justify-start rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <span
                        className={cn(
                          "h-0.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                          current
                            ? "w-7 bg-foreground"
                            : "w-3.5 bg-foreground/25 group-hover/tick:w-5 group-hover/tick:bg-foreground/60"
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="inline-end">{label}</TooltipContent>
                  </Tooltip>
                </li>
              )
            })}
          </ol>
          <div className="flex flex-col items-center gap-1 border-t pt-4">
            {railLinks.map(({ href, label, phase: linkPhase, icon: Icon }) => (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={href}
                      aria-label={label}
                      aria-current={phase === linkPhase ? "step" : undefined}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon",
                      })}
                    />
                  }
                >
                  <Icon />
                </TooltipTrigger>
                <TooltipContent side="inline-end">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </nav>

      <Container className="relative max-w-none pt-10 pb-0 md:pt-8">
        {/* The title and first spine share one editorial alignment. */}
        <motion.header
          className="relative z-20 mx-auto flex w-[82%] max-w-[52rem] flex-col gap-4 md:w-[52%]"
          initial={reduced ? false : "rest"}
          whileInView="arrived"
          viewport={{ once: true, amount: 0.7 }}
          variants={{
            rest: {},
            arrived: { transition: { staggerChildren: reduced ? 0 : 0.08 } },
          }}
        >
          <h2
            id="shelf-heading"
            className="font-heading text-[clamp(2rem,10vw,3rem)] leading-[1.15] font-bold text-balance md:text-6xl lg:text-7xl"
          >
            {["سفر", "ماجراجویی", "شما"].map((word, index) => (
              <span key={word}>
                {index > 0 ? " " : null}
                <motion.span
                  className={cn(
                    "inline-block motion-reduce:transform-none! motion-reduce:opacity-100!",
                    index === 1 && "text-accent-foreground"
                  )}
                  variants={{
                    rest: { opacity: 0.65, x: 10 },
                    arrived: { opacity: 1, x: 0 },
                  }}
                  transition={{
                    duration: reduced ? 0 : 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h2>
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              کتاب‌های انتخاب شده برای سفرتان
            </p>
            <JourneyNote
              show={personalized}
              className="text-muted-foreground"
            />
          </div>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground md:sr-only">
            {`${formatNumber(books.length)} ماجراجویی، هر کدام با یک کتاب یا کتاب صوتی؛ نشانگر را روی هر جلد ببرید تا از قفسه بیرون بیاید و با یک کلیک سفرش را شروع کنید.`}
          </p>
        </motion.header>

        {/* The stack. */}
        <ol
          ref={listRef}
          aria-label="قفسهٔ منتخب"
          className="mx-auto flex w-[82%] max-w-[52rem] flex-col gap-[clamp(2.5rem,7svh,5rem)] pt-[10svh] pb-[10svh] md:w-[52%] md:pt-[max(20svh,min(18vw,18rem))]"
        >
          {books.map((book, index) => (
            <ShelfBook
              key={book.id}
              book={book}
              index={index}
              number={index + 1}
              reduced={reduced}
              priority={index < 8}
            />
          ))}
        </ol>
      </Container>

      <HomeMediaJourney {...media} storeId={storeId} />

      {/* Scroll cue, pinned to the bottom of the screen while the shelf shows. */}
      <div
        className={cn(
          "pointer-events-none sticky bottom-5 z-[300] -mt-16 flex justify-center pb-5",
          (!shelfInView || phase !== "books") && "invisible"
        )}
      >
        <a
          href={`#${storeId}`}
          onClick={goToStore}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "pointer-events-auto h-10 rounded-full bg-background/80 px-4 shadow-lg backdrop-blur-md dark:bg-background/70"
          )}
        >
          به فروشگاه بروید
          <ChevronDownIcon data-icon="inline-end" />
        </a>
      </div>
    </section>
  )
}
