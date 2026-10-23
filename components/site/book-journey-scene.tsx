"use client"

import { useId, useState } from "react"
import { MotionConfig, motion, useReducedMotion } from "motion/react"

import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

// Adapted from public/animations/book-adventure.svg: an open book whose pages
// swing open, a glow rises, a landscape grows out of it and a trail climbs to
// a flagged summit. Same visual language as components/home/journey-route-mark.

/** Seconds after the scene enters view, in story order (≈2.8 s in all). */
const T = {
  open: 0,
  glow: 0.4,
  land: 0.5,
  sun: 0.7,
  trail: 0.85,
  birds: 1,
  flag: 1.9,
}

/** Overshoots a little, so the hills settle like they popped up. */
const EASE_POP = [0.2, 0.9, 0.3, 1.2] as const

/**
 * Plays once when it enters view, then rests on the final frame. Decorative
 * (aria-hidden); reduced motion shows the final frame straight away.
 */
export function BookJourneyScene({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const [inView, setInView] = useState(false)

  return (
    <MotionConfig reducedMotion="user">
      <motion.svg
        aria-hidden="true"
        data-book-journey=""
        viewBox="236 72 364 294"
        className={cn("overflow-visible", className)}
        onViewportEnter={() => setInView(true)}
        viewport={{ once: true, amount: 0.4 }}
      >
        {/* Rendered after mount only, so the server and the first client
            render agree whatever the motion preference is. */}
        {inView ? <Scene still={reduced === true} /> : null}
      </motion.svg>
    </MotionConfig>
  )
}

function Scene({ still }: { still: boolean }) {
  // useId can contain characters that url(#…) doesn't accept.
  const glowId = `book-glow-${useId().replace(/[^\w-]/g, "")}`

  const enter = (
    delay: number,
    duration = 0.5,
    ease: readonly [number, number, number, number] = EASE_OUT
  ) => (still ? { duration: 0 } : { delay, duration, ease })
  const from = <V,>(value: V) => (still ? false : value)

  const grow = from({ opacity: 0, y: 30, scaleY: 0.3 })
  const grown = { opacity: 1, y: 0, scaleY: 1 }

  return (
    <g>
      <defs>
        <radialGradient
          id={glowId}
          cx="400"
          cy="345"
          r="170"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* A warm glow rises from the pages. */}
      <motion.rect
        x="230"
        y="175"
        width="340"
        height="175"
        fill={`url(#${glowId})`}
        className="origin-bottom [transform-box:fill-box]"
        initial={from({ opacity: 0, scale: 0.4 })}
        animate={{ opacity: 1, scale: 1 }}
        transition={enter(T.glow, 0.6)}
      />

      {/* Sun rising behind the peak. */}
      <motion.circle
        cx="470"
        cy="110"
        r="34"
        className="fill-primary"
        initial={from({ opacity: 0, y: 40 })}
        animate={{ opacity: 0.9, y: 0 }}
        transition={enter(T.sun, 0.7)}
      />

      {/* The landscape grows up out of the book: mist ridge, peak, side peak. */}
      <motion.path
        d="M250 320 L330 200 L380 260 L420 210 L470 320 Z"
        className="origin-bottom fill-accent [transform-box:fill-box]"
        initial={grow}
        animate={grown}
        transition={enter(T.land + 0.24, 0.6, EASE_POP)}
      />
      <motion.g
        className="origin-bottom [transform-box:fill-box]"
        initial={grow}
        animate={grown}
        transition={enter(T.land + 0.12, 0.6, EASE_POP)}
      >
        <path
          d="M300 320 L400 120 L520 320 Z"
          className="fill-accent-foreground"
        />
        <path
          d="M372 176 L400 120 L428 176 L414 168 L400 180 L386 168 Z"
          className="fill-background dark:fill-foreground"
        />
      </motion.g>
      <motion.path
        d="M455 320 L520 225 L580 320 Z"
        className="origin-bottom fill-foreground/85 [transform-box:fill-box]"
        initial={grow}
        animate={grown}
        transition={enter(T.land, 0.6, EASE_POP)}
      />

      {/* The trail draws from the pages to the summit. */}
      <motion.path
        d="M400 318 C 360 300, 440 280, 400 262 S 350 230, 392 210 S 430 170, 400 128"
        fill="none"
        className="stroke-primary"
        strokeWidth="4"
        strokeLinecap="round"
        initial={from({ pathLength: 0 })}
        animate={{ pathLength: 1 }}
        transition={enter(T.trail, 1, [0.4, 0, 0.2, 1])}
      />

      {/* The flag pops on the summit, flutters a few times, then rests. */}
      <motion.g
        className="origin-bottom-left [transform-box:fill-box]"
        initial={from({ scale: 0 })}
        animate={{ scale: 1 }}
        transition={
          still
            ? { duration: 0 }
            : { delay: T.flag, type: "spring", stiffness: 420, damping: 14 }
        }
      >
        <path
          d="M400 128 V86"
          className="stroke-foreground"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <motion.path
          d="M400 88 L426 96 L400 104 Z"
          className="origin-left fill-primary [transform-box:fill-box]"
          initial={false}
          animate={
            still
              ? {}
              : {
                  skewY: [0, -6, 6, -6, 6, 0],
                  scaleX: [1, 1, 0.85, 1, 0.85, 1],
                }
          }
          transition={{ delay: T.flag + 0.2, duration: 2, ease: "easeInOut" }}
        />
      </motion.g>

      {/* Two birds drift right to left (the reading direction). */}
      <motion.g
        fill="none"
        className="stroke-foreground"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={from({ opacity: 0, x: 40 })}
        animate={{ opacity: 1, x: 0 }}
        transition={enter(T.birds, 1.6, [0.3, 0.5, 0.4, 1])}
      >
        <path d="M510 140 q8 -8 16 0 q8 -8 16 0" />
        <path d="M550 112 q6 -6 12 0 q6 -6 12 0" />
      </motion.g>

      {/* The open book: its pages swing open from the spine. */}
      <g
        className="fill-card stroke-foreground"
        strokeWidth="3"
        strokeLinejoin="round"
      >
        <motion.path
          d="M400 330 C 360 312, 300 312, 250 322 L250 348 C 300 338, 360 338, 400 356 Z"
          className="origin-right [transform-box:fill-box]"
          initial={from({ scaleX: 0 })}
          animate={{ scaleX: 1 }}
          transition={enter(T.open + 0.08, 0.55, [0.2, 0.8, 0.2, 1])}
        />
        <motion.path
          d="M400 330 C 440 312, 500 312, 550 322 L550 348 C 500 338, 440 338, 400 356 Z"
          className="origin-left [transform-box:fill-box]"
          initial={from({ scaleX: 0 })}
          animate={{ scaleX: 1 }}
          transition={enter(T.open, 0.55, [0.2, 0.8, 0.2, 1])}
        />
      </g>
      <path
        d="M400 328 V358"
        className="stroke-foreground"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect
        x="386"
        y="352"
        width="28"
        height="10"
        rx="3"
        className="fill-primary"
      />
    </g>
  )
}
