"use client"

import { MotionConfig, motion, useReducedMotion } from "motion/react"

import { usePlayerControls } from "@/components/player/player-provider"
import { cn } from "@/lib/utils"

// Peak heights per bar (fraction of the box), staggered so they never move
// in unison, like a level meter.
const bars = [
  { peaks: [0.35, 1, 0.5, 0.85, 0.35], duration: 0.9 },
  { peaks: [0.7, 0.3, 1, 0.45, 0.7], duration: 0.75 },
  { peaks: [0.45, 0.8, 0.3, 1, 0.45], duration: 1.05 },
]

/**
 * Three bars that bounce while `trackId` is playing in the global player and
 * rest low otherwise. Decorative: the play button carries the state.
 * Reduced motion keeps them still, raised while playing.
 */
export function SoundBars({
  trackId,
  className,
}: {
  trackId: string
  className?: string
}) {
  const { current, playing, buffering } = usePlayerControls()
  const reduceMotion = useReducedMotion()
  const active = current?.id === trackId && playing && !buffering

  return (
    <MotionConfig reducedMotion="user">
      <span
        aria-hidden="true"
        data-sound-bars={active ? "playing" : "idle"}
        className={cn("inline-flex h-5 items-end gap-0.75", className)}
      >
        {bars.map(({ peaks, duration }, index) => (
          <motion.span
            key={index}
            className="h-full w-1 origin-bottom rounded-full bg-primary"
            initial={false}
            animate={
              active && !reduceMotion
                ? { scaleY: peaks }
                : { scaleY: active ? peaks[1] : 0.25 }
            }
            transition={
              active && !reduceMotion
                ? { duration, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.24 }
            }
          />
        ))}
      </span>
    </MotionConfig>
  )
}
