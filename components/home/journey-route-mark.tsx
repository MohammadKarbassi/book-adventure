"use client"

import { useEffect, useRef, useState } from "react"
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"

import { EASE_OUT } from "@/lib/motion"
import { cn } from "@/lib/utils"

// The site mark (app/icon.svg) as a little scene: a trail leaves the title
// (inline-start, the right edge) and winds up to a flagged peak.
const TRAIL =
  "M236 114 C 206 116, 200 96, 174 98 S 128 106, 118 86 S 96 58, 72 30"

/** Seconds after the scene enters view, in story order. */
const T = { land: 0.35, trail: 0.85, walk: 1.4, flag: 2.25 }

/**
 * Plays once when it scrolls into view and again on mouse hover after it has
 * finished. Decorative (aria-hidden); reduced motion shows the final scene.
 */
export function JourneyRouteMark({ className }: { className?: string }) {
  const reduced = useReducedMotion()
  const [run, setRun] = useState(0)
  const [inView, setInView] = useState(false)
  const busy = useRef(false)

  function replay(event: React.PointerEvent) {
    if (reduced || event.pointerType !== "mouse" || busy.current) return
    setRun((value) => value + 1)
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.svg
        aria-hidden="true"
        data-journey-route=""
        viewBox="0 0 240 132"
        className={cn("overflow-visible", className)}
        onViewportEnter={() => setInView(true)}
        viewport={{ once: true, amount: 0.6 }}
        onPointerEnter={replay}
      >
        {inView ? (
          <Scene
            key={run}
            still={reduced === true}
            onStart={() => (busy.current = true)}
            onDone={() => (busy.current = false)}
          />
        ) : null}
      </motion.svg>
    </MotionConfig>
  )
}

function Scene({
  still,
  onStart,
  onDone,
}: {
  still: boolean
  onStart: () => void
  onDone: () => void
}) {
  const trailRef = useRef<SVGPathElement>(null)
  // The traveler walks the real trail: progress → a point on the path.
  const progress = useMotionValue(0)
  const x = useTransform(progress, (p) => pointAt(trailRef.current, p).x)
  const y = useTransform(progress, (p) => pointAt(trailRef.current, p).y)
  const traveler = useMotionValue(0)

  useEffect(() => {
    if (still) return
    onStart()
    const walk = animate(progress, 1, {
      delay: T.walk,
      duration: 1.1,
      ease: [0.45, 0, 0.25, 1],
    })
    const show = animate(traveler, [0, 1, 1, 0], {
      delay: T.walk,
      duration: 1.5,
      times: [0, 0.1, 0.75, 1],
    })
    const done = setTimeout(onDone, (T.flag + 1.6) * 1000)
    return () => {
      walk.stop()
      show.stop()
      clearTimeout(done)
    }
    // Runs once per mounted scene; the parent remounts it to replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enter = (delay: number, duration = 0.5) =>
    still ? { duration: 0 } : { delay, duration, ease: EASE_OUT }

  return (
    <g>
      {/* Sun rising behind the peak. */}
      <motion.circle
        cx="118"
        cy="34"
        r="15"
        className="fill-primary"
        initial={still ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={enter(T.land + 0.15, 0.7)}
      />
      {/* Far ridge, then the peak and its snowcap, growing out of the ground. */}
      <motion.path
        d="M96 118 L138 70 L160 94 L186 76 L226 118 Z"
        className="origin-bottom fill-accent [transform-box:fill-box]"
        initial={still ? false : { opacity: 0, scaleY: 0.3 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={enter(T.land + 0.1)}
      />
      <motion.g
        className="origin-bottom [transform-box:fill-box]"
        initial={still ? false : { opacity: 0, scaleY: 0.3 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={enter(T.land)}
      >
        <path d="M4 118 L72 28 L140 118 Z" className="fill-accent-foreground" />
        <path
          d="M58 46 L72 28 L86 46 L79 42 L72 50 L65 42 Z"
          className="fill-background"
        />
      </motion.g>
      <path
        d="M0 118 H240"
        className="stroke-border"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* The trail draws from the title to the summit. */}
      <motion.path
        ref={trailRef}
        d={TRAIL}
        fill="none"
        className="stroke-primary"
        strokeWidth="3.5"
        strokeLinecap="round"
        initial={still ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={
          still
            ? { duration: 0 }
            : { delay: T.trail, duration: 1.3, ease: [0.4, 0, 0.2, 1] }
        }
      />
      {still ? null : (
        <motion.circle
          r="4.5"
          className="fill-foreground"
          style={{ cx: x, cy: y, opacity: traveler }}
        />
      )}
      {/* The flag pops on the summit, flutters, then rests. */}
      <motion.g
        className="origin-bottom [transform-box:fill-box]"
        initial={still ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={
          still
            ? { duration: 0 }
            : { delay: T.flag, type: "spring", stiffness: 420, damping: 14 }
        }
      >
        <path
          d="M72 30 V4"
          className="stroke-foreground"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <motion.path
          d="M72 5 L50 11 L72 17 Z"
          className="origin-right fill-primary [transform-box:fill-box]"
          initial={false}
          animate={still ? {} : { skewY: [0, -8, 6, -4, 0] }}
          transition={{ delay: T.flag + 0.2, duration: 1.2 }}
        />
      </motion.g>
    </g>
  )
}

function pointAt(path: SVGPathElement | null, progress: number) {
  if (!path) return { x: 236, y: 114 }
  return path.getPointAtLength(progress * path.getTotalLength())
}
