"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { XIcon } from "lucide-react"

import {
  AttributionInfo,
  PlayPauseButton,
  SeekBar,
  SpeedMenu,
  TrackArtwork,
  TrackInfo,
  TransportControls,
} from "@/components/player/player-controls"
import {
  usePlayer,
  usePlayerControls,
} from "@/components/player/player-provider"
import type { Track } from "@/components/player/types"
import { Container } from "@/components/site/container"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

/** Bar height; the in-flow spacer uses the same classes. */
const BAR_HEIGHT = "h-16 md:h-22"

function CloseButton({ className }: { className?: string }) {
  const { close } = usePlayerControls()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label="بستن پخش‌کننده"
      onClick={close}
    >
      <XIcon />
    </Button>
  )
}

function DesktopBar({ track }: { track: Track }) {
  return (
    <Container
      className={`hidden grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)] items-center gap-6 md:grid ${BAR_HEIGHT}`}
    >
      <TrackInfo track={track} />
      <div className="flex flex-col items-center gap-1">
        <TransportControls />
        <SeekBar className="max-w-xl" />
      </div>
      <div className="flex items-center justify-end gap-1">
        <SpeedMenu />
        {track.attribution ? (
          <AttributionInfo attribution={track.attribution} />
        ) : null}
        <CloseButton />
      </div>
    </Container>
  )
}

function MobileProgress() {
  const { position, duration } = usePlayer()
  const percent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0
  return (
    <Progress
      value={percent}
      aria-label="پیشرفت پخش"
      className="absolute inset-x-0 top-0 gap-0 **:data-[slot=progress-indicator]:transition-none **:data-[slot=progress-track]:h-0.5 **:data-[slot=progress-track]:rounded-none **:data-[slot=progress-track]:bg-transparent"
    />
  )
}

function MobileBar({ track }: { track: Track }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden">
      <MobileProgress />
      <div className={`flex items-center gap-3 px-3 ${BAR_HEIGHT}`}>
        <Link
          href={track.href}
          className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`رفتن به صفحهٔ «${track.title}»`}
        >
          <TrackArtwork track={track} sizes="44px" className="size-11" />
        </Link>
        <button
          type="button"
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-md text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <span className="line-clamp-1 text-sm font-medium">
            {track.title}
          </span>
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {track.subtitle}
          </span>
          <span className="sr-only">(نمایش کامل پخش‌کننده)</span>
        </button>
        <PlayPauseButton />
        <CloseButton />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-6">
          <SheetHeader className="items-center pt-8 text-center">
            <TrackArtwork
              track={track}
              sizes="192px"
              className="mb-4 size-48 rounded-xl shadow-xl"
            />
            <SheetTitle className="font-heading text-2xl leading-snug">
              {track.title}
            </SheetTitle>
            <SheetDescription>{track.subtitle}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-6">
            <SeekBar />
            <TransportControls large />
            <div className="flex items-center justify-center gap-2">
              <SpeedMenu />
            </div>
            {track.attribution ? (
              <p className="text-center text-xs/relaxed text-muted-foreground">
                {track.attribution}
              </p>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

/**
 * The fixed bottom bar for whatever is playing. Render it after the footer:
 * it also leaves an in-flow spacer so the bar never covers the page's end.
 */
export function MiniPlayer() {
  const { current } = usePlayerControls()
  const reduceMotion = useReducedMotion()
  const open = current !== null

  // Lets global CSS lift the toasts above the bar while it is open.
  useEffect(() => {
    if (!open) return
    document.documentElement.dataset.player = "open"
    return () => {
      delete document.documentElement.dataset.player
    }
  }, [open])

  return (
    <>
      {current ? (
        <div aria-hidden="true" className={`shrink-0 ${BAR_HEIGHT}`} />
      ) : null}
      <AnimatePresence>
        {current ? (
          <motion.section
            key="mini-player"
            aria-label="پخش‌کننده"
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 shadow-[0_-8px_24px_-12px] shadow-black/15 backdrop-blur-md"
          >
            <DesktopBar track={current} />
            <MobileBar track={current} />
          </motion.section>
        ) : null}
      </AnimatePresence>
    </>
  )
}
