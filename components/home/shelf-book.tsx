"use client"

import { useId, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react"
import { ArrowLeftIcon, BookOpenIcon, HeadphonesIcon } from "lucide-react"

import { PriceTag } from "@/components/book/price-tag"
import {
  STATIC_TILT,
  shelfTilt,
  shelfZIndex,
  spineLayout,
  type ShelfBook as ShelfBookData,
} from "@/components/home/shelf-geometry"
import { cn } from "@/lib/utils"

/** How far the cover (top face) and back (bottom face) reach into the screen. */
const DEPTH = 180
const PERSPECTIVE = 1100

// Lighting overlays on top of the book's own color: dark headbands at both
// ends, a rounded-spine falloff from top to bottom and a fine cloth weave.
const SPINE_LIGHT: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(to right, rgb(0 0 0 / 0.3), rgb(0 0 0 / 0) 3%, rgb(0 0 0 / 0) 97%, rgb(0 0 0 / 0.3))",
    "linear-gradient(to bottom, rgb(255 255 255 / 0.2), rgb(255 255 255 / 0) 38%, rgb(0 0 0 / 0) 62%, rgb(0 0 0 / 0.24))",
    "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.04) 0 1px, transparent 1px 3px)",
    "repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.05) 0 1px, transparent 1px 3px)",
  ].join(", "),
}

const BACK_LIGHT: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(to bottom, rgb(0 0 0 / 0.15), rgb(0 0 0 / 0.45))",
    "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.04) 0 1px, transparent 1px 3px)",
  ].join(", "),
}

type ShelfBookProps = {
  book: ShelfBookData
  index: number
  /** Static tilt instead of scroll-driven rotation. */
  reduced: boolean
  /** Eagerly load the cover (first books of the stack). */
  priority?: boolean
}

export function ShelfBook({ book, index, reduced, priority }: ShelfBookProps) {
  const itemRef = useRef<HTMLLIElement>(null)
  const priceId = useId()
  const [active, setActive] = useState(false)
  const { thickness, widthPct, offsetPct } = spineLayout(book)

  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ["start end", "end start"],
  })
  const tilt = useSpring(
    useTransform(scrollYProgress, (p) => shelfTilt(p)),
    {
      stiffness: 140,
      damping: 26,
      mass: 0.5,
    }
  )
  const zIndex = useTransform(scrollYProgress, shelfZIndex)

  const isAudio = book.type === "audiobook"
  const ink = book.color.isDark
    ? "text-white [--rule:rgb(255_255_255/0.35)]"
    : "text-black/85 [--rule:rgb(0_0_0/0.3)]"

  return (
    <motion.li
      ref={itemRef}
      data-shelf-index={index}
      className="relative"
      style={{
        zIndex: active ? 200 : (zIndex as MotionValue<number>),
        width: `${widthPct}%`,
        marginInlineStart: `${offsetPct}%`,
      }}
    >
      <Link
        href={`/book/${book.id}`}
        aria-label={`${book.title} اثر ${book.author}`}
        aria-describedby={priceId}
        className="group/shelf-book relative block rounded-[3px] outline-none"
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
          className="relative block transform-3d"
          style={{
            height: thickness,
            rotateX: reduced ? STATIC_TILT : tilt,
            transformPerspective: PERSPECTIVE,
            transformOrigin: `50% 50% ${-DEPTH / 2}px`,
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
                sizes={`${DEPTH}px`}
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

          {/* Front face: the spine. */}
          <span
            className={cn(
              "absolute inset-0 flex items-center gap-4 overflow-hidden rounded-[3px] px-[6%] shadow-md shadow-black/25 transition-shadow duration-300 backface-hidden group-hover/shelf-book:shadow-2xl group-hover/shelf-book:shadow-black/40 group-focus-visible/shelf-book:shadow-2xl group-focus-visible/shelf-book:ring-3 group-focus-visible/shelf-book:ring-ring group-focus-visible/shelf-book:ring-inset",
              ink
            )}
            style={{ backgroundColor: book.color.dominant, ...SPINE_LIGHT }}
          >
            {/* Highlight along the top edge and raised bands near both ends. */}
            <span className="pointer-events-none absolute inset-x-[2%] top-[3px] h-px bg-white/30" />
            <span className="pointer-events-none absolute inset-y-0 start-[3.5%] w-[3px] border-x border-(--rule) opacity-70" />
            <span className="pointer-events-none absolute inset-y-0 end-[3.5%] w-[3px] border-x border-(--rule) opacity-70" />

            <span className="w-[18%] shrink-0 truncate text-[0.7rem] leading-tight font-medium opacity-80 sm:w-[22%] sm:text-xs">
              {book.author}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-center font-heading leading-none font-bold",
                thickness >= 64 ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
              )}
            >
              {book.title}
            </span>
            <span className="flex w-[12%] shrink-0 items-center justify-end gap-1.5 opacity-80">
              {isAudio ? <HeadphonesIcon className="size-3.5" /> : null}
              <span className="flex size-5 items-center justify-center rounded-s-[2px] rounded-e-[5px] border border-current/50">
                <BookOpenIcon className="size-3" />
              </span>
            </span>
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
            مشاهده
            <ArrowLeftIcon className="size-3.5" />
          </span>
        </span>
      </Link>
    </motion.li>
  )
}
