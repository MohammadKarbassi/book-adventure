"use client"

import type { VariantProps } from "class-variance-authority"
import { PauseIcon, PlayIcon } from "lucide-react"

import { usePlayerControls } from "@/components/player/player-provider"
import type { Track } from "@/components/player/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

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
      {iconOnly ? <span className="sr-only">{text}</span> : text}
    </Button>
  )
}
