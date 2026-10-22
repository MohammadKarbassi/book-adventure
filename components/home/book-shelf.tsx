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
}

const railLinks = [
  { href: "/audiobooks", label: "کتاب‌های صوتی", icon: HeadphonesIcon },
  { href: "/podcasts", label: "پادکست‌ها", icon: PodcastIcon },
]

/** «سفر ماجراجویی شما»: a scroll-tilted stack of the adventures. */
export function BookShelf({
  books: defaultBooks,
  categoryOf,
  storeId,
}: BookShelfProps) {
  const { items: books, personalized } = useJourneyOrder(
    defaultBooks,
    categoryOf
  )
  const listRef = useRef<HTMLOListElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  // useReducedMotion reads matchMedia on the client only; wait for hydration
  // so the first client render matches the server.
  const prefersReduced = useReducedMotion()
  const reduced = useHydrated() && prefersReduced === true

  // The book nearest the middle of the viewport is the "current" one.
  const { scrollY } = useScroll()
  const updateActive = useCallback(() => {
    const items = listRef.current?.children
    if (!items?.length) return
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
  }, [])
  useMotionValueEvent(scrollY, "change", updateActive)
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
      aria-labelledby="shelf-heading"
      className="relative isolate min-h-[calc(100svh-4rem)] overflow-x-clip"
    >
      {/* Lantern light behind the stack. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[120svh] bg-radial-[ellipse_at_50%_35%] from-primary/12 via-transparent to-transparent"
      />

      <Container className="relative grid grid-cols-1 gap-x-8 gap-y-10 pt-10 pb-24 md:grid-cols-[2.5rem_minmax(0,1fr)] md:pt-14 lg:grid-cols-[2.5rem_15rem_minmax(0,1fr)] xl:gap-x-12">
        {/* Index rail at the binding (inline-start) edge. */}
        <nav
          aria-label="فهرست قفسه"
          className="sticky top-16 row-span-2 hidden h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6 self-start md:flex"
        >
          <ol className="flex flex-col items-center">
            {books.map((book, index) => {
              const current = index === activeIndex
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
            {railLinks.map(({ href, label, icon: Icon }) => (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={href}
                      aria-label={label}
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
        </nav>

        {/* Editorial title block, top-start. */}
        <motion.header
          className="flex flex-col gap-3 self-start lg:sticky lg:top-28"
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              کتاب‌های انتخاب شده برای سفرتان
            </p>
            <JourneyNote show={personalized} />
          </div>
          <h1
            id="shelf-heading"
            className="font-heading text-5xl leading-[0.95] font-bold text-balance lg:text-6xl"
          >
            سفر ماجراجویی شما
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            {`${formatNumber(books.length)} ماجراجویی، هر کدام با یک کتاب یا کتاب صوتی؛ نشانگر را روی هر جلد ببرید تا از قفسه بیرون بیاید و با یک کلیک سفرش را شروع کنید.`}
          </p>
          <div className="mt-2 hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            <span className="font-heading text-2xl leading-none text-foreground tabular-nums">
              {formatNumber(activeIndex + 1)}
            </span>
            <span>از {formatNumber(books.length)}</span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </motion.header>

        {/* The stack. */}
        <ol
          ref={listRef}
          aria-label="قفسهٔ منتخب"
          className="flex w-full max-w-2xl flex-col gap-3.5 pt-6 pb-[12svh] md:col-start-2 md:w-[calc(100%-13rem)] md:pt-[12svh] lg:col-start-3 lg:row-start-1 lg:row-end-3"
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

      {/* Scroll cue, pinned to the bottom of the screen while the shelf shows. */}
      <div className="pointer-events-none sticky bottom-5 z-[300] -mt-16 flex justify-center pb-5">
        <a
          href={`#${storeId}`}
          onClick={goToStore}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "pointer-events-auto h-10 rounded-full bg-background/80 px-4 shadow-lg backdrop-blur-md dark:bg-background/70"
          )}
        >
          به فروشگاه بروید
          <ChevronDownIcon
            data-icon="inline-end"
            className="animate-bounce motion-reduce:animate-none"
          />
        </a>
      </div>
    </section>
  )
}
