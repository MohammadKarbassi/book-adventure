"use client"

import type { VariantProps } from "class-variance-authority"
import { PauseIcon, PlayIcon } from "lucide-react"
import { AnimatePresence, MotionConfig, motion } from "motion/react"

import { usePlayerControls } from "@/components/player/player-provider"
import type { Track } from "@/components/player/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DURATION, EASE_OUT } from "@/lib/motion"

type PlayButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "onClick" | "variant" | "size"
> & {
  track: Track
  /** Visible label while this track isn't playing, e.g. «پخش نمونه». */
  label: string
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  className?: string
}

/**
 * Crossfades a play/pause/buffering icon when `id` changes. The exiting icon
 * pops out of flow, so the button keeps its size. Reduced motion drops the
 * scale and keeps the fade.
 */
export function IconSwap({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={id}
          className="inline-flex"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.8,
            transition: { duration: DURATION.fast, ease: EASE_OUT },
          }}
          transition={{ duration: 0.12, ease: EASE_OUT }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </MotionConfig>
  )
}

/**
 * Plays `track` in the global player, or pauses/resumes it when it is
 * already the current track.
 */
export function PlayButton({
  track,
  label,
  variant,
  size,
  className,
  ...props
}: PlayButtonProps) {
  const { current, playing, buffering, play } = usePlayerControls()
  const isCurrent = current?.id === track.id
  const active = isCurrent && playing
  const text = active ? "توقف" : label
  const iconOnly = size?.startsWith("icon") ?? false

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      aria-pressed={active}
      onClick={() => play(track)}
      {...props}
    >
      <IconSwap
        id={active && buffering ? "buffering" : active ? "pause" : "play"}
      >
        {active && buffering ? (
          <Spinner
            aria-hidden="true"
            role="presentation"
            data-icon="inline-start"
          />
        ) : active ? (
          <PauseIcon data-icon="inline-start" className="fill-current" />
        ) : (
          <PlayIcon data-icon="inline-start" className="fill-current" />
        )}
      </IconSwap>
      {iconOnly ? <span className="sr-only">{text}</span> : text}
    </Button>
  )
}
