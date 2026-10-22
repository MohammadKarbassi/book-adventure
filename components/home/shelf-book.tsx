"use client"

import { useId, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"
import { ArrowLeftIcon } from "lucide-react"

import { BookSpine } from "@/components/book/book-spine"
import { PriceTag } from "@/components/book/price-tag"
import {
  STATIC_TILT,
  shelfTilt,
  shelfZIndex,
  spineLayout,
  type ShelfBook as ShelfBookData,
} from "@/components/home/shelf-geometry"
import { formatNumber } from "@/lib/format"

/** How far the cover (top face) and back (bottom face) reach into the screen. */
const DEPTH = "66cqw"
const PERSPECTIVE = 1100
/** Hovered or focused books tip forward at least this much to show a band of their cover. */
const HOVER_TILT = -24

const BACK_LIGHT: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(to bottom, rgb(0 0 0 / 0.15), rgb(0 0 0 / 0.45))",
    "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.04) 0 1px, transparent 1px 3px)",
  ].join(", "),
}

type ShelfBookProps = {
  book: ShelfBookData
  index: number
  /** Adventure number in the displayed (possibly personalized) order. */
  number: number
  /** Static tilt instead of scroll-driven rotation. */
  reduced: boolean
  /** Eagerly load the cover (first books of the stack). */
  priority?: boolean
}

export function ShelfBook({
  book,
  index,
  number,
  reduced,
  priority,
}: ShelfBookProps) {
  const itemRef = useRef<HTMLLIElement>(null)
  const priceId = useId()
  const [active, setActiveState] = useState(false)
  // Mirrors `active` for the tilt, without waiting for a re-render.
  const lifted = useMotionValue(0)
  function setActive(next: boolean) {
    lifted.set(next ? 1 : 0)
    setActiveState(next)
  }
  const { thickness, widthPct, offsetPct } = spineLayout(book)

  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ["start end", "end start"],
  })
  // Scroll tilt, overridden while hovered or focused: any book, wherever it
  // is on screen, tips forward to show its cover, then settles back.
  const targetTilt = useTransform(
    [scrollYProgress, lifted],
    ([progress, lift]: number[]) => {
      const base = reduced ? STATIC_TILT : shelfTilt(progress)
      return lift ? Math.min(base, HOVER_TILT) : base
    }
  )
  const tilt = useSpring(targetTilt, {
    stiffness: 140,
    damping: 26,
    mass: 0.5,
  })
  const zIndex = useTransform(scrollYProgress, shelfZIndex)

  return (
    <motion.li
      ref={itemRef}
      layout={reduced ? false : "position"}
      transition={{ layout: { type: "spring", stiffness: 170, damping: 26 } }}
      data-shelf-index={index}
      className="@container relative"
      style={{
        zIndex: active ? 200 : (zIndex as MotionValue<number>),
        width: `${widthPct}%`,
        marginInlineStart: `${offsetPct}%`,
      }}
    >
      <Link
        href={`/adventures/${book.id}`}
        aria-label={`ماجراجویی ${formatNumber(number)}: ${book.name} — ${book.title} اثر ${book.author}`}
        aria-describedby={priceId}
        className="group/shelf-book relative block rounded-[3px] outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setActive(true)
        }}
        onPointerLeave={() => setActive(false)}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) setActive(true)
        }}
        onBlur={() => setActive(false)}
      >
        <motion.span
          aria-hidden="true"
          data-shelf-body=""
          className="relative block transform-3d"
          style={{
            height: `clamp(2rem, ${thickness / 6}cqw, 6.5rem)`,
            rotateX: reduced ? targetTilt : tilt,
            transformPerspective: PERSPECTIVE,
            transformOrigin: "50% 50%",
          }}
          initial={false}
          // Pull the book out toward the viewer and the binding side (RTL).
          animate={active ? { z: 42, x: 18 } : { z: 0, x: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
        >
          {/* Top face: the cover, lying flat with its spine toward us. */}
          <span
            className="@container absolute inset-x-0 bottom-full origin-bottom overflow-hidden rounded-t-[2px] backface-hidden"
            style={{
              height: DEPTH,
              backgroundColor: book.color.dominant,
              transform: "rotateX(90deg)",
            }}
          >
            <span
              className="absolute inset-0 m-auto h-[100cqw] rotate-90"
              style={{ width: DEPTH }}
            >
              <Image
                src={book.image}
                alt=""
                fill
                sizes="(min-width: 768px) 40vw, 65vw"
                loading={priority ? "eager" : "lazy"}
                className="object-cover"
              />
            </span>
            <span className="absolute inset-0 bg-linear-to-t from-black/0 via-black/10 to-black/45" />
          </span>

          {/* Bottom face: the back cover. */}
          <span
            className="absolute inset-x-0 top-full origin-top rounded-b-[2px] backface-hidden"
            style={{
              height: DEPTH,
              backgroundColor: book.color.dominant,
              transform: "rotateX(-90deg)",
              ...BACK_LIGHT,
            }}
          />

          {/* Front face: the spine, cover art wrapped around it. */}
          <span className="absolute inset-0 overflow-hidden rounded-[3px] shadow-md shadow-black/25 transition-shadow duration-300 backface-hidden group-hover/shelf-book:shadow-2xl group-hover/shelf-book:shadow-black/40 group-focus-visible/shelf-book:shadow-2xl">
            <BookSpine
              title={book.title}
              author={book.author}
              image={book.image}
              color={book.color}
              number={number}
              priority={priority}
            />
            <span className="pointer-events-none absolute inset-0 rounded-[3px] group-focus-visible/shelf-book:ring-3 group-focus-visible/shelf-book:ring-ring group-focus-visible/shelf-book:ring-inset" />
          </span>
        </motion.span>

        {/* Price chip beside the pulled-out book (pointer and keyboard). */}
        <span
          id={priceId}
          className="pointer-events-none invisible absolute start-full top-1/2 ms-5 hidden -translate-y-1/2 items-center gap-3 rounded-full border bg-popover px-3.5 py-1.5 whitespace-nowrap text-popover-foreground opacity-0 shadow-lg transition-[opacity,visibility] duration-200 group-hover/shelf-book:visible group-hover/shelf-book:opacity-100 group-focus-visible/shelf-book:visible group-focus-visible/shelf-book:opacity-100 motion-reduce:transition-none md:flex"
          data-slot="shelf-price"
        >
          <PriceTag book={book} />
          <span className="flex items-center gap-1 text-xs font-medium text-accent-foreground">
            شروع ماجراجویی
            <ArrowLeftIcon className="size-3.5" />
          </span>
        </span>
      </Link>
    </motion.li>
  )
}
