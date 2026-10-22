"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  MotionConfig,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react"

import {
  AdventureBar,
  AdventureHelp,
  AdventureMark,
  AdventureRail,
} from "@/components/adventures/adventure-rail"
import { AdventureSection } from "@/components/adventures/adventure-section"
import type { AdventureView } from "@/components/adventures/adventure-types"
import { activeSection } from "@/components/adventures/journey-math"
import type { CategoryMap } from "@/components/adventures/journey-order"
import type { Room } from "@/components/adventures/room-colors"
import { useJourneyOrder } from "@/components/adventures/use-journey-order"
import { useHydrated } from "@/lib/store"
import { cn } from "@/lib/utils"

/** Scopes the theme tokens (and dark: variants) to a room's ink. */
function inkOf(room?: Room) {
  return {
    className: room?.tone === "dark" ? "dark" : undefined,
    style: room?.vars as React.CSSProperties | undefined,
  }
}

type AdventureJourneyProps = {
  /** All adventures, in their default order. */
  adventures: AdventureView[]
  categoryOf: CategoryMap
  /** The adventure in the URL: scrolled to on load. */
  initialId: number
}

/**
 * «مسیر ماجراجویی»: every adventure on one continuous, immersive page (the
 * site header and footer step aside, see globals.css). Each adventure is a
 * full-color room; the rail, the mark and the URL follow the room at the
 * viewport center and take on its ink.
 */
export function AdventureJourney({
  adventures,
  categoryOf,
  initialId,
}: AdventureJourneyProps) {
  const { items, personalized } = useJourneyOrder(adventures, categoryOf)
  const hydrated = useHydrated()
  const prefersReduced = useReducedMotion()
  const reduced = hydrated && prefersReduced === true

  const [activeId, setActiveId] = useState(initialId)
  // Rooms under the mark (top) and the help button (bottom), for their ink.
  const [topId, setTopId] = useState(initialId)
  const [bottomId, setBottomId] = useState(initialId)
  const [turned, setTurned] = useState(false)
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  )
  const roomOf = (id: number) =>
    (items.find((item) => item.id === id) ?? items[activeIndex])?.room

  const rootRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const topsRef = useRef<number[]>([])
  const idsRef = useRef<number[]>([])
  /** URL updates start once the deep link has been honored. */
  const readyRef = useRef(false)

  /** Space taken at the top by the compact bar (small screens only). */
  const offset = useCallback(() => barRef.current?.offsetHeight ?? 0, [])

  const update = useCallback(() => {
    const tops = topsRef.current
    if (!tops.length) return
    const index = activeSection(tops, window.scrollY + window.innerHeight / 2)
    const id = idsRef.current[index]
    if (id === undefined) return
    setActiveId(id)
    // Just below the compact bar on small screens; the mark's height on large.
    const edge = 28
    setTopId(
      idsRef.current[
        activeSection(tops, window.scrollY + Math.max(edge, offset() + 8))
      ]
    )
    setBottomId(
      idsRef.current[
        activeSection(tops, window.scrollY + window.innerHeight - edge)
      ]
    )
    if (readyRef.current && window.location.pathname !== `/adventures/${id}`) {
      // Integrates with the App Router (no navigation, no scroll jump).
      window.history.replaceState(null, "", `/adventures/${id}`)
    }
  }, [offset])

  const measure = useCallback(() => {
    const sections = rootRef.current?.querySelectorAll<HTMLElement>(
      "[data-adventure-section]"
    )
    if (!sections) return
    topsRef.current = [...sections].map(
      (section) => section.getBoundingClientRect().top + window.scrollY
    )
    idsRef.current = [...sections].map((section) =>
      Number(section.dataset.adventureSection)
    )
    update()
  }, [update])

  // Re-measure when the order changes and whenever the content resizes.
  useEffect(() => {
    measure()
    const root = rootRef.current
    if (!root) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(root)
    return () => observer.disconnect()
  }, [measure, items])

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", update)

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior) => {
      const item = items[index]
      const section = item && document.getElementById(`adventure-${item.id}`)
      if (!section) return
      const top =
        section.getBoundingClientRect().top + window.scrollY - offset()
      window.scrollTo({ top: Math.max(0, top), behavior })
    },
    [items, offset]
  )

  // Deep link: once the (possibly personalized) order is in place, jump to
  // the adventure from the URL without animation, then let the URL follow.
  useEffect(() => {
    if (!hydrated || readyRef.current) return
    const frame = requestAnimationFrame(() => {
      const index = items.findIndex((item) => item.id === initialId)
      const section = document.getElementById(`adventure-${initialId}`)
      if (section) {
        const rect = section.getBoundingClientRect()
        const middle = window.innerHeight / 2
        // Skip if the browser already restored a position inside it.
        if (rect.top > middle || rect.bottom < middle) {
          scrollToIndex(index, "instant")
        }
      }
      readyRef.current = true
      measure()
    })
    return () => cancelAnimationFrame(frame)
  }, [hydrated, items, initialId, scrollToIndex, measure])

  const select = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), items.length - 1)
      scrollToIndex(clamped, reduced ? "auto" : "smooth")
    },
    [items.length, reduced, scrollToIndex]
  )

  const markTurned = useCallback(() => setTurned(true), [])
  const railItems = items.map(({ id, name }) => ({ id, name }))

  return (
    <MotionConfig reducedMotion="user">
      <div ref={rootRef} data-immersive="" className="relative isolate">
        <h1 className="sr-only">مسیر ماجراجویی</h1>

        {/* Chrome: each piece takes on the ink of the room it sits over. */}
        <div
          ref={barRef}
          {...inkOf(roomOf(topId))}
          className={cn(
            inkOf(roomOf(topId)).className,
            "sticky top-0 z-30 lg:hidden"
          )}
        >
          <AdventureBar
            items={railItems}
            activeIndex={activeIndex}
            onSelect={select}
          />
        </div>
        <div className="pointer-events-none fixed inset-y-0 start-0 z-30 hidden w-20 flex-col items-center justify-between py-5 in-data-[player=open]:pb-28 lg:flex xl:w-24 [&>*]:pointer-events-auto">
          <div {...inkOf(roomOf(topId))}>
            <AdventureMark />
          </div>
          <div {...inkOf(roomOf(activeId))}>
            <AdventureRail
              items={railItems}
              activeIndex={activeIndex}
              reduced={reduced}
              onSelect={select}
            />
          </div>
          <div {...inkOf(roomOf(bottomId))}>
            <AdventureHelp />
          </div>
        </div>

        {items.map((adventure, index) => (
          <AdventureSection
            key={adventure.id}
            adventure={adventure}
            index={index}
            total={items.length}
            reduced={reduced}
            personalized={personalized}
            next={items[index + 1]}
            onNext={() => select(index + 1)}
            showHint={!turned}
            onFirstTurn={markTurned}
            priority={adventure.id === initialId}
          />
        ))}
      </div>
    </MotionConfig>
  )
}
