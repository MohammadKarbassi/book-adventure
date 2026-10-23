"use client"

// Building blocks shared by the desktop bar and the mobile sheet.

import { useId, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  GaugeIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
} from "lucide-react"

import {
  usePlayer,
  usePlayerControls,
} from "@/components/player/player-provider"
import { PLAYBACK_RATES, SKIP_SECONDS } from "@/components/player/progress"
import type { Track } from "@/components/player/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatClock, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

/** 1.25 → "۱٫۲۵×" */
export function formatRate(rate: number): string {
  return `${formatNumber(rate)}×`
}

export function TrackArtwork({
  track,
  className,
  sizes,
}: {
  track: Track
  className?: string
  sizes: string
}) {
  return (
    <span
      className={cn(
        "relative isolate block shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10",
        className
      )}
      style={track.color ? { backgroundColor: track.color } : undefined}
    >
      <Image
        src={track.artwork}
        alt=""
        fill
        sizes={sizes}
        className="object-cover"
      />
      {track.color ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 start-0 w-1"
          style={{ backgroundColor: track.color }}
        />
      ) : null}
    </span>
  )
}

export function TrackInfo({
  track,
  className,
}: {
  track: Track
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Link
        href={track.href}
        className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`رفتن به صفحهٔ «${track.title}»`}
      >
        <TrackArtwork track={track} sizes="56px" className="size-14" />
      </Link>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          href={track.href}
          className="line-clamp-1 rounded-sm font-medium outline-none hover:underline hover:underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {track.title}
        </Link>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {track.subtitle}
        </p>
      </div>
    </div>
  )
}

/** Skip icon with the number of seconds printed inside the circle. */
function SkipIcon({ forward }: { forward: boolean }) {
  // In RTL, "forward" moves toward the left: a counter-clockwise arrow.
  const Icon = forward ? RotateCcwIcon : RotateCwIcon
  return (
    <span className="relative inline-flex items-center justify-center">
      <Icon className="size-6" strokeWidth={1.75} />
      <span
        aria-hidden="true"
        className="absolute pt-0.5 text-[0.625rem] leading-none font-bold"
      >
        {formatNumber(SKIP_SECONDS)}
      </span>
    </span>
  )
}

export function PlayPauseButton({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  const { playing, buffering, toggle } = usePlayerControls()
  return (
    <Button
      size="icon-lg"
      className={cn("rounded-full", className)}
      aria-label={playing ? "توقف" : "پخش"}
      onClick={toggle}
    >
      {playing && buffering ? (
        <Spinner
          aria-hidden="true"
          role="presentation"
          className={cn("size-5", iconClassName)}
        />
      ) : playing ? (
        <PauseIcon className={cn("size-5 fill-current", iconClassName)} />
      ) : (
        <PlayIcon className={cn("size-5 fill-current", iconClassName)} />
      )}
    </Button>
  )
}

export function TransportControls({
  large = false,
  className,
}: {
  large?: boolean
  className?: string
}) {
  const { skip } = usePlayerControls()
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <Button
        variant="ghost"
        size={large ? "icon-lg" : "icon"}
        className="rounded-full"
        aria-label={`${formatNumber(SKIP_SECONDS)} ثانیه عقب`}
        onClick={() => skip(-SKIP_SECONDS)}
      >
        <SkipIcon forward={false} />
      </Button>
      <PlayPauseButton
        className={large ? "size-14" : "size-10"}
        iconClassName={large ? "size-6" : undefined}
      />
      <Button
        variant="ghost"
        size={large ? "icon-lg" : "icon"}
        className="rounded-full"
        aria-label={`${formatNumber(SKIP_SECONDS)} ثانیه جلو`}
        onClick={() => skip(SKIP_SECONDS)}
      >
        <SkipIcon forward />
      </Button>
    </div>
  )
}

export function SeekBar({ className }: { className?: string }) {
  const { position, duration, seek, current } = usePlayer()
  const labelId = useId()
  // While dragging, the thumb follows the pointer and the audio seeks once
  // on release instead of on every pixel.
  const [scrub, setScrub] = useState<number | null>(null)
  const max = duration > 0 ? duration : 1
  const value = Math.min(scrub ?? position, max)
  const known = duration > 0

  return (
    <div className={cn("flex w-full items-center gap-3", className)}>
      <span id={labelId} className="sr-only">
        زمان پخش
      </span>
      <span className="w-12 shrink-0 text-start text-xs text-muted-foreground tabular-nums">
        {formatClock(value)}
      </span>
      <Slider
        aria-labelledby={labelId}
        min={0}
        max={max}
        step={1}
        value={[value]}
        disabled={!current || !known}
        onValueChange={(next) => {
          const [seconds] = Array.isArray(next) ? next : [next]
          setScrub(seconds)
        }}
        onValueCommitted={(next) => {
          const [seconds] = Array.isArray(next) ? next : [next]
          seek(seconds)
          setScrub(null)
        }}
        className="flex-1"
      />
      <span className="w-12 shrink-0 text-end text-xs text-muted-foreground tabular-nums">
        {known ? formatClock(duration) : "–:––"}
      </span>
    </div>
  )
}

export function SpeedMenu({ className }: { className?: string }) {
  const { rate, setRate } = usePlayerControls()
  const label = formatRate(rate)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn("min-w-14 tabular-nums", className)}
            aria-label={`سرعت پخش ${label}`}
          />
        }
      >
        <GaugeIcon data-icon="inline-start" />
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="center" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuLabel>سرعت پخش</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={String(rate)}
            onValueChange={(value) => setRate(Number(value))}
          >
            {PLAYBACK_RATES.map((option) => (
              <DropdownMenuRadioItem
                key={option}
                value={String(option)}
                closeOnClick
                className="tabular-nums"
              >
                {option === 1
                  ? `${formatRate(option)} (عادی)`
                  : formatRate(option)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AttributionInfo({ attribution }: { attribution: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="منبع و مجوز صدا" />
        }
      >
        <InfoIcon />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 leading-relaxed">
        {attribution}
      </TooltipContent>
    </Tooltip>
  )
}
