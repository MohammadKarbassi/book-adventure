"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react"
import { BookOpenIcon } from "lucide-react"

import type { AdventureView } from "@/components/adventures/adventure-types"
import {
  DRAG_DEG_PER_PX,
  MAX_TILT_X,
  nearestTurn,
} from "@/components/adventures/journey-math"
import { BookSpine } from "@/components/book/book-spine"
import { cn } from "@/lib/utils"

/** Width of the cover the depth is measured against. */
const BASE_WIDTH = 300

// Poses (degrees). Persian books bind on the right: a negative rotateY turns
// the spine toward the reader, a positive one shows the cover and the
// fore-edge of the pages.
const SPINE_POSE = -72
const REST_POSE = -17
const REST_TILT = 12
/** Extra turn while the section scrolls by, ± this much. */
const SCROLL_TURN = 5
/** Back to the resting pose after this long without input. */
const IDLE_MS = 1200
const KEY_IDLE_MS = 2600
const KEY_STEP = 30

const SETTLE = { type: "spring", stiffness: 60, damping: 13, mass: 1 } as const
const ARRIVE = {
  type: "spring",
  stiffness: 38,
  damping: 11,
  mass: 1.1,
} as const

const toRad = (deg: number) => (deg * Math.PI) / 180

// Page edges: fine lines parallel to the cover, over paper tinted by it.
const PAGES_SIDE =
  "repeating-linear-gradient(to right, rgb(0 0 0 / 0.08) 0 1px, transparent 1px 2.5px)"
const PAGES_EDGE =
  "repeating-linear-gradient(to bottom, rgb(0 0 0 / 0.08) 0 1px, transparent 1px 2.5px)"
/** Hard boards overhang the page block by this much. */
const OVERHANG = "3px"

type AdventureBook3DProps = {
  adventure: AdventureView
  /** Displayed adventure number, printed on the spine. */
  number: number
  reduced: boolean
  /** Section element, for the gentle scroll turn. */
  sectionRef: React.RefObject<HTMLElement | null>
  /** Show «برای چرخاندن، کتاب را بکشید» until the reader has tried it. */
  showHint: boolean
  onFirstTurn: () => void
  priority?: boolean
  className?: string
  sceneReady?: boolean
}

/** Shade a face by how far it is turned away from the reader. */
function useShade(rotateY: MotionValue<number>, normal: number, max = 0.55) {
  return useTransform(rotateY, (deg) => {
    const facing = Math.cos(toRad(deg + normal))
    return (1 - Math.max(0, facing)) * max
  })
}

/**
 * The showpiece: a CSS 3D hardcover with all six faces. It arrives on its
 * spine and turns to a three-quarter view, follows the scroll a little, and
 * can be grabbed and spun all the way round (drag or arrow keys), with
 * momentum, before it settles back.
 */
export function AdventureBook3D({
  adventure,
  number,
  reduced,
  sectionRef,
  showHint,
  onFirstTurn,
  priority,
  className,
  sceneReady = false,
}: AdventureBook3DProps) {
  const { book, palette, depth } = adventure
  const author = book.authors[0] ?? ""
  const paper = `color-mix(in oklab, white 86%, ${book.color.dominant})`
  const board = book.color.dominant

  const stageRef = useRef<HTMLDivElement>(null)
  const turn = useMotionValue(reduced ? REST_POSE : SPINE_POSE)
  const tilt = useMotionValue(REST_TILT)
  const animations = useRef<AnimationPlaybackControls[]>([])
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const drag = useRef<{
    id: number
    x: number
    y: number
    turn: number
    tilt: number
    samples: { x: number; t: number }[]
  } | null>(null)

  function stop() {
    animations.current.forEach((animation) => animation.stop())
    animations.current = []
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = null
  }

  /** Spring (or jump) back to the resting pose by the shortest way round. */
  function settle() {
    stop()
    if (reduced) {
      turn.jump(REST_POSE)
      tilt.jump(REST_TILT)
      return
    }
    turn.jump(nearestTurn(turn.get(), REST_POSE))
    animations.current = [
      animate(turn, REST_POSE, SETTLE),
      animate(tilt, REST_TILT, SETTLE),
    ]
  }

  function settleLater(ms = IDLE_MS) {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(settle, ms)
  }

  // Arrives on its spine and turns to the cover once mostly on screen; turns
  // back when it leaves, so every visit replays the reveal.
  const inView = useInView(stageRef, { amount: 0.6 })
  useEffect(() => {
    if (drag.current) return
    stop()
    if (reduced) {
      turn.jump(REST_POSE)
      tilt.jump(REST_TILT)
      return
    }
    const target = inView ? REST_POSE : SPINE_POSE
    turn.jump(nearestTurn(turn.get(), target))
    animations.current = [
      animate(turn, target, ARRIVE),
      animate(tilt, REST_TILT, ARRIVE),
    ]
    // Only the visibility and the motion preference start a new pose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduced])

  useEffect(
    () => () => {
      animations.current.forEach((animation) => animation.stop())
      if (idleTimer.current) clearTimeout(idleTimer.current)
    },
    []
  )

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const scrollTurn = useTransform(scrollYProgress, (p) =>
    reduced ? 0 : (p - 0.5) * 2 * SCROLL_TURN
  )
  const rotateY = useTransform([turn, scrollTurn], ([a, b]: number[]) => a + b)

  // Faces' outward normals as rotateY offsets: front 0, spine (right) +90,
  // pages (left) −90, back 180.
  const frontShade = useShade(rotateY, 0)
  const backShade = useShade(rotateY, 180)
  const spineShade = useShade(rotateY, 90)
  const pagesShade = useShade(rotateY, -90, 0.4)
  // The footprint on the table: wide on the cover, narrow on the spine.
  const shadowScale = useTransform(rotateY, (deg) => {
    const r = toRad(deg)
    return Math.abs(Math.cos(r)) + Math.abs(Math.sin(r)) * (depth / BASE_WIDTH)
  })

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    stop()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      turn: turn.get(),
      tilt: tilt.get(),
      samples: [{ x: event.clientX, t: event.timeStamp }],
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    turn.set(current.turn + dx * DRAG_DEG_PER_PX)
    tilt.set(
      Math.min(Math.max(current.tilt - dy * 0.25, -MAX_TILT_X), MAX_TILT_X)
    )
    current.samples = [
      ...current.samples.filter((sample) => event.timeStamp - sample.t < 100),
      { x: event.clientX, t: event.timeStamp },
    ]
    if (Math.abs(dx) > 6) onFirstTurn()
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    drag.current = null
    const [first] = current.samples
    const elapsed = Math.max(event.timeStamp - first.t, 1)
    // px/ms → deg/s
    const velocity =
      ((event.clientX - first.x) / elapsed) * 1000 * DRAG_DEG_PER_PX
    if (!reduced && Math.abs(velocity) > 40) {
      animations.current = [
        animate(turn, turn.get(), {
          type: "inertia",
          velocity,
          power: 0.5,
          timeConstant: 420,
        }),
      ]
    }
    settleLater()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === "ArrowLeft"
        ? -KEY_STEP
        : event.key === "ArrowRight"
          ? KEY_STEP
          : 0
    if (!step) return
    event.preventDefault()
    stop()
    onFirstTurn()
    const target = turn.get() + step
    if (reduced) turn.jump(target)
    else animations.current = [animate(turn, target, SETTLE)]
    settleLater(KEY_IDLE_MS)
  }

  const half = "calc(var(--bd) / 2)"

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-8 [--bh:calc(var(--bw)*1.5)] [--bw:min(60vw,16rem)] min-[900px]:[--bw:min(28vw,47svh,29rem)]",
        className
      )}
      style={
        {
          "--bd": `calc(var(--bw) * ${depth / BASE_WIDTH})`,
        } as React.CSSProperties
      }
    >
      <div
        ref={stageRef}
        role="img"
        tabIndex={0}
        aria-label="کتاب سه‌بعدی؛ برای چرخاندن بکشید"
        aria-roledescription="کتاب چرخان"
        data-book-stage=""
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative cursor-grab touch-pan-y rounded-md outline-none select-none perspective-[1600px] focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:ring-offset-8 focus-visible:ring-offset-transparent active:cursor-grabbing"
      >
        <motion.div
          data-book-body=""
          className="relative h-(--bh) w-(--bw) transform-3d"
          style={{
            rotateY,
            rotateX: tilt,
            rotateZ: 3.5,
            opacity: sceneReady ? 0 : 1,
          }}
        >
          {/* Front board: the cover. */}
          <div
            className="absolute inset-0 overflow-hidden rounded-s-[1px] rounded-e-[3px] backface-hidden"
            style={{ transform: `translateZ(${half})`, backgroundColor: board }}
          >
            <Image
              src={book.image}
              alt=""
              fill
              draggable={false}
              sizes="(min-width: 1024px) 32vw, 60vw"
              loading={priority ? "eager" : "lazy"}
              className="object-cover"
            />
            {/* Hinge groove near the spine (right) and a soft sheen. */}
            <span
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to left, rgb(0 0 0 / 0.3), rgb(255 255 255 / 0.18) 1.6%, rgb(0 0 0 / 0.14) 3.2%, rgb(0 0 0 / 0) 6%), linear-gradient(115deg, rgb(255 255 255 / 0.16), rgb(255 255 255 / 0) 38%, rgb(0 0 0 / 0) 70%, rgb(0 0 0 / 0.12))",
              }}
            />
            <motion.span
              className="absolute inset-0 bg-black"
              style={{ opacity: frontShade }}
            />
          </div>

          {/* Back board: a designed back cover. */}
          <div
            className="absolute inset-0 overflow-hidden rounded-s-[3px] rounded-e-[1px] backface-hidden"
            style={{
              transform: `rotateY(180deg) translateZ(${half})`,
              backgroundColor: palette.bottom,
            }}
          >
            <Image
              src={book.image}
              alt=""
              fill
              draggable={false}
              sizes="160px"
              loading="lazy"
              className="scale-125 object-cover opacity-45 blur-lg"
            />
            <span className="absolute inset-0 bg-linear-to-b from-black/35 via-black/45 to-black/70" />
            <span className="absolute inset-0 flex flex-col items-center justify-between px-[12%] py-[14%] text-center text-white">
              <span className="flex flex-col items-center gap-3">
                <span className="text-[0.6rem] tracking-wide opacity-75 lg:text-xs">
                  {author}
                </span>
                <span className="font-heading text-xl leading-tight font-bold text-balance lg:text-3xl">
                  {book.title}
                </span>
                <span className="h-px w-10 bg-white/50" />
                <span className="line-clamp-4 text-[0.6rem] leading-relaxed opacity-85 lg:text-xs">
                  {adventure.tagline}
                </span>
              </span>
              <span className="flex items-center gap-2 opacity-90">
                <span className="flex size-6 items-center justify-center rounded-s-[2px] rounded-e-md border border-white/50 lg:size-7">
                  <BookOpenIcon className="size-3.5 lg:size-4" />
                </span>
                <span className="font-heading text-sm font-bold lg:text-base">
                  ماجراجویی با کتاب
                </span>
              </span>
            </span>
            <motion.span
              className="absolute inset-0 bg-black"
              style={{ opacity: backShade }}
            />
          </div>

          {/* Spine, on the right: the cover art wraps onto it. */}
          <div
            className="absolute top-0 h-full w-(--bd) overflow-hidden rounded-[2px] backface-hidden"
            style={{
              left: "calc(50% - var(--bd) / 2)",
              transform: "rotateY(90deg) translateZ(calc(var(--bw) / 2))",
            }}
          >
            <span className="absolute top-1/2 left-1/2 block h-(--bd) w-(--bh) -translate-1/2 -rotate-90">
              <BookSpine
                title={book.title}
                author={author}
                image={book.image}
                color={book.color}
                number={number}
                priority={priority}
              />
            </span>
            <motion.span
              className="absolute inset-0 bg-black"
              style={{ opacity: spineShade }}
            />
          </div>

          {/* Fore-edge (left): the page block, set in from the boards, with
              the boards' thin edges at front and back. */}
          <div
            className="absolute w-(--bd) backface-hidden"
            style={{
              top: OVERHANG,
              bottom: OVERHANG,
              left: "calc(50% - var(--bd) / 2)",
              transform: `rotateY(-90deg) translateZ(calc(var(--bw) / 2 - ${OVERHANG}))`,
              backgroundColor: paper,
              backgroundImage: `${PAGES_SIDE}, linear-gradient(to right, rgb(0 0 0 / 0.14), rgb(0 0 0 / 0) 16%, rgb(0 0 0 / 0) 84%, rgb(0 0 0 / 0.14))`,
              boxShadow: `inset 3px 0 0 ${palette.bottom}, inset -3px 0 0 ${board}`,
            }}
          >
            <motion.span
              className="absolute inset-0 bg-black"
              style={{ opacity: pagesShade }}
            />
          </div>

          {/* Head and tail: page edges between the boards. */}
          {(["top", "bottom"] as const).map((edge) => (
            <div
              key={edge}
              className="absolute start-0 w-full backface-hidden"
              style={{
                height: "var(--bd)",
                top: "calc(50% - var(--bd) / 2)",
                transform: `rotateX(${edge === "top" ? 90 : -90}deg) translateZ(calc(var(--bh) / 2 - ${OVERHANG}))`,
                backgroundColor: paper,
                backgroundImage: `${PAGES_EDGE}, linear-gradient(to left, ${board} 0 5px, transparent 5px)`,
                boxShadow: `inset 0 3px 0 ${edge === "top" ? palette.bottom : board}, inset 0 -3px 0 ${edge === "top" ? board : palette.bottom}`,
                filter: edge === "bottom" ? "brightness(0.7)" : undefined,
              }}
            />
          ))}
        </motion.div>

        {/* Contact shadow on the "table", following the book's footprint. */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-7 mx-auto h-7 w-(--bw) rounded-[50%] bg-black/35 blur-xl"
          style={{ scaleX: shadowScale, opacity: sceneReady ? 0 : 1 }}
        />
      </div>

      <p
        aria-hidden={!showHint}
        className={cn(
          "text-xs text-muted-foreground transition-opacity duration-700 motion-reduce:transition-none",
          showHint ? "opacity-100" : "opacity-0"
        )}
      >
        برای چرخاندن، کتاب را بکشید
      </p>
    </div>
  )
}
