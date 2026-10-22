"use client"

import { useRef, type CSSProperties, type ReactNode } from "react"
import {
  AnimatePresence,
  motion,
  useTransform,
  type MotionValue,
} from "motion/react"

import { PaperPage, type PageSide } from "@/components/reader/paper-page"
import { themeStyle, type PageTheme } from "@/components/reader/page-themes"
import type { PageTurn, Turn } from "@/components/reader/use-page-turn"
import {
  FONT_STEPS,
  PAGE_GEOMETRY,
  spreadPages,
  textAreaHeight,
  type Layout,
  type ReaderBook,
  type ReaderPage,
} from "@/lib/reader"
import { cn } from "@/lib/utils"

type FlipBookProps = {
  book: ReaderBook
  pages: ReaderPage[]
  layout: Layout
  spread: number
  spreads: number
  engine: PageTurn
  reduced: boolean
  fontStep: number
  theme: PageTheme
}

/** Pointer travel (px) before a press becomes a drag. */
const DRAG_SLOP = 8
/** Release past this share of the turn completes it. */
const COMPLETE_AT = 0.35
/** A flick faster than this (px/ms) completes the turn too. */
const FLICK_SPEED = 0.6

type DragState = {
  id: number
  x0: number
  y0: number
  t0: number
  active: boolean
  dir: 1 | -1
  progress: number
  rect: DOMRect
}

/**
 * The open book. Persian books bind on the right: on a spread the right page
 * comes first, and turning forward lifts the LEFT page and swings it over the
 * spine to the right. The turning leaf is its own element: front = the left
 * page being lifted, back = the next spread's right page. On mobile a single
 * page swings away around its right (inline-start) edge.
 */
export function FlipBook({
  book,
  pages,
  layout,
  spread,
  spreads,
  engine,
  reduced,
  fontStep,
  theme,
}: FlipBookProps) {
  const { turn, progress } = engine
  const geometry = PAGE_GEOMETRY[layout]
  const padBlock = (100 / geometry.aspect - textAreaHeight(layout)) / 2
  const drag = useRef<DragState | null>(null)

  const count = pages.length
  const pageAt = (index: number | null) =>
    index === null ? null : pages[index]
  const face = (index: number | null, side: PageSide, showThrough = false) => (
    <PaperPage
      page={pageAt(index)}
      index={index}
      side={side}
      layout={layout}
      book={book}
      showThrough={showThrough}
    />
  )

  // What lies under the leaf: the destination's left page and the origin's
  // right page (see Turn). Without a turn, the current spread.
  const current = spreadPages(spread, layout, count)
  const lo = turn ? spreadPages(turn.lo, layout, count) : current
  const hi = turn ? spreadPages(turn.hi, layout, count) : current
  const under =
    layout === "spread"
      ? { right: lo.right, left: hi.left }
      : { right: hi.right, left: null }

  // Paper stacked on the outer edges: read pages on the right, unread on
  // the left, thicker as they pile up.
  const read = spreads > 1 ? spread / (spreads - 1) : 0
  const edge = (share: number) => Math.round(2 + share * 7)

  // Pointer input: tap a half to turn, or drag the page across.
  function pointerTarget(event: React.PointerEvent) {
    const target = event.target as Element
    return !target.closest("a, button, input, [data-no-turn]")
  }

  function progressFor(state: DragState, clientX: number) {
    const { rect, dir } = state
    const pageWidth = layout === "spread" ? rect.width / 2 : rect.width
    // Where the leaf's free edge should be, relative to the spine.
    const start = dir === 1 ? -pageWidth : pageWidth
    const edgeX = start + (clientX - state.x0)
    const cos = Math.min(1, Math.max(-1, -edgeX / pageWidth))
    return Math.acos(cos) / Math.PI
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !pointerTarget(event) || turn) return
    drag.current = {
      id: event.pointerId,
      x0: event.clientX,
      y0: event.clientY,
      t0: event.timeStamp,
      active: false,
      dir: 1,
      progress: 0,
      rect: event.currentTarget.getBoundingClientRect(),
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state || state.id !== event.pointerId) return
    const dx = event.clientX - state.x0
    const dy = event.clientY - state.y0
    if (!state.active) {
      if (Math.abs(dy) > DRAG_SLOP * 1.5 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null
        return
      }
      if (Math.abs(dx) < DRAG_SLOP) return
      // Dragging to the right turns forward (the left page swings right).
      state.dir = dx > 0 ? 1 : -1
      if (!reduced && !engine.beginDrag(state.dir)) {
        drag.current = null
        return
      }
      state.active = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    if (reduced) return
    state.progress = progressFor(state, event.clientX)
    engine.dragTo(state.progress)
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current
    drag.current = null
    if (!state || state.id !== event.pointerId) return
    const dx = event.clientX - state.x0
    if (!state.active) {
      // A tap: the left half turns forward, the right half back.
      const middle = state.rect.left + state.rect.width / 2
      engine.go(event.clientX < middle ? 1 : -1)
      return
    }
    if (reduced) {
      if (Math.abs(dx) > 40) engine.go(state.dir)
      return
    }
    const startAt = state.dir === 1 ? 0 : 1
    const speed = dx / Math.max(1, event.timeStamp - state.t0)
    const flick =
      Math.sign(speed) === state.dir && Math.abs(speed) > FLICK_SPEED
    engine.endDrag(Math.abs(state.progress - startAt) > COMPLETE_AT || flick)
  }

  function onPointerCancel() {
    if (drag.current?.active) engine.endDrag(false)
    drag.current = null
  }

  const style = {
    ...themeStyle(theme),
    "--fs": geometry.fontSize,
    "--step": FONT_STEPS[fontStep],
    "--pad-block": padBlock,
    aspectRatio: layout === "spread" ? geometry.aspect * 2 : geometry.aspect,
  } as CSSProperties

  const staticPages = (
    <>
      <Half
        side="right"
        layout={layout}
        hint={
          !turn && (layout === "single" ? spread < spreads - 1 : spread > 0)
        }
      >
        {face(under.right, "right")}
      </Half>
      {layout === "spread" ? (
        <Half side="left" layout={layout} hint={!turn && spread < spreads - 1}>
          {face(under.left, "left")}
        </Half>
      ) : null}
    </>
  )

  return (
    <div
      role="region"
      aria-roledescription="کتاب"
      aria-label={`کتاب ${book.title}`}
      className={cn(
        "relative touch-pan-y select-none",
        layout === "spread"
          ? "w-[min(100cqw,calc(100cqh*4/3))]"
          : "w-[min(100cqw,calc(100cqh*3/5))]"
      )}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {/* Hard cover board behind the block of pages. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute -inset-y-[1.6%] rounded-md shadow-2xl ring-1 ring-black/20",
          layout === "spread" ? "-inset-x-[1.4%]" : "-start-[1%] -end-[3%]"
        )}
        style={{ backgroundColor: book.color.dominant }}
      >
        <div className="absolute inset-0 rounded-md bg-linear-to-b from-white/10 to-black/25" />
      </div>

      <div className="absolute inset-0 perspective-[2400px]">
        {/* Page edges stacked on the outer sides. */}
        {layout === "spread" ? (
          <PageEdge side="start" width={edge(read)} />
        ) : null}
        <PageEdge side="end" width={edge(1 - read)} />

        <AnimatePresence initial={false}>
          <motion.div
            key={reduced ? `${layout}-${spread}` : "pages"}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {staticPages}
          </motion.div>
        </AnimatePresence>

        {layout === "spread" ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-1/2 w-[3%] translate-x-1/2 bg-linear-to-r from-transparent via-black/15 to-transparent"
          />
        ) : null}

        {turn ? (
          <TurningLeaf
            turn={turn}
            layout={layout}
            progress={progress}
            front={
              layout === "spread"
                ? face(lo.left, "left")
                : face(lo.right, "right")
            }
            back={
              layout === "spread"
                ? face(hi.right, "right")
                : face(lo.right, "left", true)
            }
          />
        ) : null}
      </div>
    </div>
  )
}

function Half({
  side,
  layout,
  hint,
  children,
}: {
  side: PageSide
  layout: Layout
  hint: boolean
  children: ReactNode
}) {
  // The corner a reader would grab: outer bottom corner, forward on the left.
  const forward = layout === "single" || side === "left"
  return (
    <div
      className={cn(
        "group/half absolute inset-y-0 cursor-pointer overflow-hidden",
        layout === "single" ? "inset-x-0 rounded-e-sm" : "w-1/2",
        layout === "spread" &&
          (side === "right" ? "start-0 rounded-s-sm" : "end-0 rounded-e-sm")
      )}
    >
      {children}
      {hint ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-0 aspect-square w-0 transition-[width] duration-300 ease-out group-hover/half:w-[9%] motion-reduce:transition-none",
            forward ? "end-0" : "start-0"
          )}
          style={{
            backgroundImage: `linear-gradient(${forward ? "to top right" : "to top left"}, var(--paper-edge) 0%, var(--paper) 42%, rgb(0 0 0 / 0.22) 50%, transparent 54%)`,
          }}
        />
      ) : null}
    </div>
  )
}

function PageEdge({ side, width }: { side: "start" | "end"; width: number }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-y-[0.5%] rounded-sm"
      style={{
        width,
        [side === "start" ? "insetInlineStart" : "insetInlineEnd"]: -width,
        backgroundImage:
          "repeating-linear-gradient(to left, var(--paper) 0 1px, var(--paper-edge) 1px 2px)",
        boxShadow: "0 1px 2px rgb(0 0 0 / 0.25)",
      }}
    />
  )
}

function TurningLeaf({
  turn,
  layout,
  progress,
  front,
  back,
}: {
  turn: Turn
  layout: Layout
  progress: MotionValue<number>
  front: ReactNode
  back: ReactNode
}) {
  // The leaf rests over the left page (or the whole page on mobile) with its
  // hinge on its right edge, and rotates toward the reader, right-ward.
  const rotateY = useTransform(progress, (p) => p * 180)
  // A slight sag mid-turn sells the bend of the paper.
  const skewY = useTransform(progress, (p) => Math.sin(p * Math.PI) * -0.8)
  const scaleY = useTransform(
    progress,
    (p) => 1 + Math.sin(p * Math.PI) * 0.012
  )
  const lift = useTransform(progress, (p) => Math.sin(p * Math.PI))

  // Shadow the leaf casts beyond its edge, on the page it uncovers (before
  // the half-way point) and on the page it is about to land on (after).
  const leftShare = useTransform(progress, (p) =>
    Math.max(0, Math.cos(p * Math.PI))
  )
  const rightShare = useTransform(progress, (p) =>
    Math.max(0, -Math.cos(p * Math.PI))
  )
  const pageShare = layout === "spread" ? 50 : 100
  // Darkest right at the leaf's edge, fading out over the uncovered paper.
  const leftWidth = useTransform(
    leftShare,
    (share) => `calc(${share * pageShare}% + 64px)`
  )
  const rightWidth = useTransform(
    rightShare,
    (share) => `calc(${share * pageShare}% + 64px)`
  )
  const leftShadow = useTransform(
    [leftShare, lift],
    ([share, l]: number[]) =>
      `linear-gradient(to right, transparent, rgb(0 0 0 / ${0.1 * l * Math.min(1, share * 4)}) 40px, rgb(0 0 0 / ${0.26 * l * Math.min(1, share * 4)}) 64px)`
  )
  const rightShadow = useTransform(
    [rightShare, lift],
    ([share, l]: number[]) =>
      `linear-gradient(to left, transparent, rgb(0 0 0 / ${0.1 * l * Math.min(1, share * 4)}) 40px, rgb(0 0 0 / ${0.26 * l * Math.min(1, share * 4)}) 64px)`
  )

  return (
    <div
      aria-hidden="true"
      inert
      data-turning={turn.dir === 1 ? "forward" : "back"}
      className="pointer-events-none absolute inset-0"
    >
      <motion.div
        className={cn(
          "absolute inset-y-0",
          layout === "spread" ? "start-1/2" : "start-0"
        )}
        style={{ width: leftWidth, backgroundImage: leftShadow }}
      />
      {layout === "spread" ? (
        <motion.div
          className="absolute inset-y-0 end-1/2"
          style={{ width: rightWidth, backgroundImage: rightShadow }}
        />
      ) : null}

      <motion.div
        data-slot="turning-leaf"
        className={cn(
          "absolute inset-y-0 transform-3d",
          layout === "spread" ? "end-0 w-1/2" : "inset-x-0"
        )}
        style={{
          transformOrigin: "100% 50%",
          rotateY,
          skewY,
          scaleY,
        }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-e-sm backface-hidden">
          {front}
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: lift,
              backgroundImage:
                "linear-gradient(to left, rgb(0 0 0 / 0.28), rgb(0 0 0 / 0.04) 22%, rgb(255 255 255 / 0.12) 55%, rgb(0 0 0 / 0.2))",
            }}
          />
        </div>
        <div className="absolute inset-0 transform-[rotateY(180deg)] overflow-hidden rounded-s-sm backface-hidden">
          {back}
          <motion.div
            className="absolute inset-0"
            style={{
              opacity: lift,
              backgroundImage:
                "linear-gradient(to right, rgb(0 0 0 / 0.3), rgb(0 0 0 / 0.05) 25%, rgb(255 255 255 / 0.1) 60%, rgb(0 0 0 / 0.16))",
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}
