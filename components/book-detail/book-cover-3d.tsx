"use client"

import {
  MotionConfig,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"

import { BookCover } from "@/components/book/book-cover"
import type { BookColor } from "@/lib/catalog"
import { cn } from "@/lib/utils"

type BookCover3DProps = {
  book: { title: string; image: string; color: BookColor }
  className?: string
}

// Resting pose: the spine (inline-start, the right edge in Persian) turned
// slightly towards the reader. The pointer adds a few degrees either way.
const REST_Y = -12
const REST_X = 2
const TILT = 9
const spring = { stiffness: 160, damping: 18, mass: 0.6 }

export function BookCover3D({ book, className }: BookCover3DProps) {
  const reduceMotion = useReducedMotion()
  // Pointer position over the cover, -0.5 … 0.5 on each axis.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateY = useSpring(
    useTransform(px, [-0.5, 0.5], [REST_Y - TILT, REST_Y + TILT]),
    spring
  )
  const rotateX = useSpring(
    useTransform(py, [-0.5, 0.5], [REST_X + TILT * 0.6, REST_X - TILT * 0.6]),
    spring
  )
  const glareX = useTransform(px, [-0.5, 0.5], [0, 100])
  const glareY = useTransform(py, [-0.5, 0.5], [0, 100])
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.22), transparent 60%)`

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width - 0.5)
    py.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  function handlePointerLeave() {
    px.set(0)
    py.set(0)
  }

  // MotionConfig keeps the entrance a plain fade for reduced motion; the
  // pointer tilt is skipped in handlePointerMove. Both render the same markup
  // on the server and the client, so hydration never mismatches.
  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn("relative perspective-[1400px]", className)}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <motion.div
          className="relative transform-3d"
          style={{ rotateY, rotateX }}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <BookCover
            book={book}
            size="xl"
            priority
            sizes="(min-width: 1024px) 256px, 192px"
            className="w-48 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45),0_12px_24px_-12px_rgb(0_0_0/0.35)] sm:w-56 lg:w-64"
          />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-s-[3px] rounded-e-lg mix-blend-soft-light"
            style={{ backgroundImage: glare }}
          />
        </motion.div>
        {/* Contact shadow on the "table" under the book. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 -bottom-6 h-6 rounded-[50%] bg-black/25 blur-xl dark:bg-black/60"
        />
      </div>
    </MotionConfig>
  )
}
