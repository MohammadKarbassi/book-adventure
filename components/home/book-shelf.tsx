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
import { ShelfScene } from "@/components/home/shelf-scene"
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
  const [shelfInView, setShelfInView] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  // useReducedMotion reads matchMedia on the client only; wait for hydration
  // so the first client render matches the server.
  const prefersReduced = useReducedMotion()
  const reduced = useHydrated() && prefersReduced === true

  // The book nearest the middle of the viewport is the "current" one.
  const { scrollY } = useScroll()
  const updateActive = useCallback(() => {
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
  }, [storeId])
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
      id="adventure-shelf"
      aria-labelledby="shelf-heading"
      data-press-shelf=""
      data-shelf-in-view={shelfInView ? "true" : "false"}
      className="relative isolate min-h-svh overflow-x-clip bg-background text-foreground"
    >
      <ShelfScene books={books} />
      <Container className="relative max-w-none pt-8 pb-24 md:pt-0">
        {/* Index rail at the binding (inline-start) edge. */}
        <nav
          aria-label="فهرست قفسه"
          className="absolute inset-y-0 start-3 hidden w-10 md:block lg:start-6"
        >
          <div className="sticky top-16 flex h-[calc(100svh-4rem)] flex-col items-center justify-center gap-6">
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
          </div>
        </nav>

        {/* Editorial title block, top-start. */}
        <motion.header
          className="relative mx-auto flex max-w-sm flex-col gap-2 ps-4 md:absolute md:start-24 md:top-9 md:mx-0 md:max-w-64 md:ps-0"
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
          <h2
            id="shelf-heading"
            className="font-heading text-4xl leading-tight font-bold text-balance md:text-3xl"
          >
            سفر ماجراجویی شما
          </h2>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground md:sr-only">
            {`${formatNumber(books.length)} ماجراجویی، هر کدام با یک کتاب یا کتاب صوتی؛ نشانگر را روی هر جلد ببرید تا از قفسه بیرون بیاید و با یک کلیک سفرش را شروع کنید.`}
          </p>
          <div className="mt-2 hidden items-center gap-2 text-xs text-muted-foreground">
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
          className="mx-auto flex w-[82%] max-w-[52rem] flex-col gap-[clamp(2.5rem,7svh,5rem)] pt-[16svh] pb-[20svh] md:w-[52%] md:pt-[28svh]"
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
      <div
        className={cn(
          "pointer-events-none sticky bottom-5 z-[300] -mt-16 flex justify-center pb-5",
          !shelfInView && "invisible"
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
