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
import { AdventureBook3D } from "@/components/adventures/adventure-book-3d"
import {
  JourneyEnding,
  type EndingPodcast,
} from "@/components/adventures/journey-ending"
import {
  AdventureScene,
  type SceneState,
} from "@/components/adventures/adventure-scene"
import type { AdventureView } from "@/components/adventures/adventure-types"
import {
  activeSection,
  bookTrigger,
  journeyCamera,
} from "@/components/adventures/journey-math"
import type { CategoryMap } from "@/components/adventures/journey-order"
import { useJourneyOrder } from "@/components/adventures/use-journey-order"
import { useHydrated } from "@/lib/store"
import { cn } from "@/lib/utils"

type Props = {
  adventures: AdventureView[]
  categoryOf: CategoryMap
  initialId: number
  podcast?: EndingPodcast
}

/** Native document flow, one active index, one fixed renderer. */
export function AdventureJourney({
  adventures,
  categoryOf,
  initialId,
  podcast,
}: Props) {
  const { items, personalized } = useJourneyOrder(adventures, categoryOf)
  const hydrated = useHydrated()
  const prefersReduced = useReducedMotion()
  const reduced = hydrated && prefersReduced === true
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      0,
      adventures.findIndex((item) => item.id === initialId)
    )
  )
  const [small, setSmall] = useState(false)
  const [turned, setTurned] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const active = items[activeIndex] ?? items[0]
  const rootRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const topsRef = useRef<number[]>([])
  const idsRef = useRef<number[]>([])
  const praiseTopsRef = useRef<number[]>([])
  const praiseHeightsRef = useRef<number[]>([])
  const readyRef = useRef(false)
  const restoringRef = useRef(false)
  const destinationRef = useRef<number | null>(null)
  const sceneState = useRef<SceneState>({
    index: activeIndex,
    scroll: 0,
    previous: 0,
    local: 0,
    ratio: 0.027,
    scale: 1,
    activeScroll: 0,
    bookOffsets: [],
  })
  const offset = useCallback(() => barRef.current?.offsetHeight ?? 0, [])

  const update = useCallback(() => {
    const tops = topsRef.current
    if (!tops.length || !readyRef.current) return
    const index = activeSection(
      tops,
      window.scrollY + window.innerHeight * bookTrigger(window.innerWidth)
    )
    const id = idsRef.current[index]
    if (id === undefined) return
    // All consumers use this index, including colors, visibility and scene.
    setActiveIndex(index)
    sceneState.current = {
      index,
      bookOffsets: tops.map(
        (_, i) =>
          journeyCamera(
            i,
            window.scrollY,
            window.innerWidth,
            window.innerHeight,
            tops,
            praiseTopsRef.current,
            praiseHeightsRef.current
          ).previous
      ),
      ...journeyCamera(
        index,
        window.scrollY,
        window.innerWidth,
        window.innerHeight,
        tops,
        praiseTopsRef.current,
        praiseHeightsRef.current
      ),
    }
    if (destinationRef.current !== null && destinationRef.current !== id) return
    destinationRef.current = null
    if (
      !restoringRef.current &&
      window.location.pathname !== `/adventures/${id}`
    ) {
      window.history.replaceState(
        { ...window.history.state, adventureId: id },
        "",
        `/adventures/${id}`
      )
    }
  }, [])

  const measure = useCallback(() => {
    const sections = rootRef.current?.querySelectorAll<HTMLElement>(
      "[data-adventure-section]"
    )
    if (!sections) return
    setSmall(window.innerWidth < 900)
    topsRef.current = [...sections].map(
      (section) => section.getBoundingClientRect().top + window.scrollY
    )
    idsRef.current = [...sections].map((section) =>
      Number(section.dataset.adventureSection)
    )
    praiseTopsRef.current = [...sections].map((section) => {
      const praise = section.querySelector("[data-adventure-praise]")
      // An empty Praise marker still has a measured boundary.
      return (praise ?? section).getBoundingClientRect().top + window.scrollY
    })
    praiseHeightsRef.current = [...sections].map(
      (section) =>
        section
          .querySelector("[data-adventure-praise]")
          ?.getBoundingClientRect().height ?? 0
    )
    update()
  }, [update])

  useEffect(() => {
    measure()
    const root = rootRef.current
    if (!root) return
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    window.addEventListener("resize", measure)
    let live = true
    void document.fonts.ready.then(() => {
      if (live) measure()
    })
    return () => {
      live = false
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [measure, items])
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", update)

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior) => {
      const item = items[index]
      const section = item && document.getElementById(`adventure-${item.id}`)
      if (!section) return
      window.scrollTo({
        top: Math.max(
          0,
          section.getBoundingClientRect().top + window.scrollY - offset()
        ),
        behavior,
      })
    },
    [items, offset]
  )

  useEffect(() => {
    if (!hydrated || readyRef.current) return
    const frame = requestAnimationFrame(() => {
      // Native history may restore a URL newer than the cached RSC props.
      const pathId = Number(
        /^\/adventures\/(\d+)$/.exec(window.location.pathname)?.[1]
      )
      const targetId = items.some((item) => item.id === pathId)
        ? pathId
        : initialId
      const index = items.findIndex((item) => item.id === targetId)
      const section = document.getElementById(`adventure-${targetId}`)
      if (section) {
        const rect = section.getBoundingClientRect()
        const line = window.innerHeight * bookTrigger(window.innerWidth)
        if (rect.top > line || rect.bottom < line)
          scrollToIndex(index, "instant")
      }
      readyRef.current = true
      measure()
    })
    return () => cancelAnimationFrame(frame)
  }, [hydrated, initialId, items, measure, scrollToIndex])

  useEffect(() => {
    if (!readyRef.current) return
    // Deliberate enhancement: title changes during scroll were not confirmed in Stripe.
    document.title = `ماجراجویی: ${active.name} | ماجراجویی با کتاب`
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", `/adventures/${active.id}`)
  }, [active, hydrated])

  useEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = "manual"
    let frame = 0
    const restore = () => {
      const match = /^\/adventures\/(\d+)$/.exec(window.location.pathname)
      const index = match
        ? items.findIndex((item) => item.id === Number(match[1]))
        : -1
      if (index < 0) return // Next handles returning to the shelf/other routes.
      restoringRef.current = true
      destinationRef.current = null
      scrollToIndex(index, "instant")
      measure()
      frame = requestAnimationFrame(() => {
        restoringRef.current = false
      })
    }
    const cancelDestination = () => {
      destinationRef.current = null
    }
    window.addEventListener("popstate", restore)
    window.addEventListener("wheel", cancelDestination, { passive: true })
    window.addEventListener("touchstart", cancelDestination, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("popstate", restore)
      window.removeEventListener("wheel", cancelDestination)
      window.removeEventListener("touchstart", cancelDestination)
      window.history.scrollRestoration = previous
    }
  }, [items, measure, scrollToIndex])

  const select = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), items.length - 1)
      destinationRef.current = items[clamped]?.id ?? null
      scrollToIndex(clamped, reduced ? "auto" : "smooth")
    },
    [items, reduced, scrollToIndex]
  )
  const markTurned = useCallback(() => setTurned(true), [])
  const railItems = items.map(({ id, name }) => ({ id, name }))
  const ink = { style: active.room.vars as React.CSSProperties }

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={rootRef}
        data-immersive=""
        data-active-adventure={active.id}
        data-active-index={activeIndex}
        data-scene-ready={sceneReady ? "true" : "false"}
        className={cn(
          "relative isolate",
          active.room.tone === "dark" && "dark"
        )}
        style={
          {
            ...active.room.vars,
            backgroundColor: active.room.top,
          } as React.CSSProperties
        }
      >
        <h1 className="sr-only">مسیر ماجراجویی</h1>
        <AdventureScene
          adventures={items}
          state={sceneState}
          rootRef={rootRef}
          reduced={reduced}
          onReady={setSceneReady}
        />
        <div
          {...ink}
          data-active-book={active.id}
          className="pointer-events-none fixed inset-y-0 end-[max(8vw,calc((100vw-1280px)/2))] z-20 hidden w-[min(48.72vw,742.4px)] items-center justify-center in-data-[book-offscreen=true]:invisible min-[900px]:flex [&>*]:pointer-events-auto"
        >
          <AdventureBook3D
            key={active.id}
            adventure={active}
            number={activeIndex + 1}
            reduced={reduced}
            sectionRef={rootRef}
            showHint={!turned}
            onFirstTurn={markTurned}
            priority
            sceneReady={sceneReady}
          />
        </div>
        <div
          ref={barRef}
          {...ink}
          className="sticky top-0 z-30 min-[900px]:hidden"
        >
          <AdventureBar
            items={railItems}
            activeIndex={activeIndex}
            onSelect={select}
          />
        </div>
        <div
          {...ink}
          className="pointer-events-none fixed inset-y-0 start-0 z-30 hidden w-20 flex-col items-center justify-between py-5 in-data-[player=open]:pb-28 min-[900px]:flex xl:w-24 [&>*]:pointer-events-auto"
        >
          <AdventureMark />
          <AdventureRail
            items={railItems}
            activeIndex={activeIndex}
            reduced={reduced}
            onSelect={select}
          />
          <AdventureHelp />
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
            visible={Math.abs(index - activeIndex) < (small ? 1 : 2)}
            sceneReady={sceneReady}
          />
        ))}
        <JourneyEnding
          audio={items.find((item) => item.book.type === "audiobook")}
          podcast={podcast}
          adventures={items}
          onSelect={(id) => select(items.findIndex((item) => item.id === id))}
        />
      </div>
    </MotionConfig>
  )
}
