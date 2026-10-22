"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  animate,
  useMotionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react"

/**
 * A leaf turning between spreads `lo` and `hi`. The leaf belongs to `lo`
 * (front: its left page) and lands on `hi` (back: its right page), so
 * `progress` 0 shows `lo` and 1 shows `hi`. Forward turns run 0 → 1,
 * backward turns run 1 → 0.
 */
export type Turn = {
  lo: number
  hi: number
  from: number
  to: number
  dir: 1 | -1
  mode: "auto" | "drag"
}

/** Seconds for a full turn. */
const TURN_DURATION = 0.78
/** A natural page-turn ease: quick lift, unhurried landing. */
const TURN_EASE = [0.32, 0.08, 0.24, 1] as const

type Options = {
  spread: number
  count: number
  reduced: boolean
  onCommit: (spread: number) => void
}

export type PageTurn = {
  turn: Turn | null
  progress: MotionValue<number>
  /** Turns by `delta` spreads; while a turn runs, queues one more. */
  go: (delta: number) => void
  /** Jumps to a spread with a single turn; ignored while turning. */
  goTo: (spread: number) => void
  beginDrag: (dir: 1 | -1) => boolean
  dragTo: (progress: number) => void
  endDrag: (complete: boolean) => void
  /**
   * Ends a running turn at once (e.g. before re-paginating) and returns the
   * spread it settled on, or null when no turn was running.
   */
  settle: () => number | null
}

export function usePageTurn(options: Options): PageTurn {
  const progress = useMotionValue(0)
  const [turn, setTurn] = useState<Turn | null>(null)

  const latest = useRef(options)
  const spreadRef = useRef(options.spread)
  const turnRef = useRef<Turn | null>(null)
  const controls = useRef<AnimationPlaybackControls | null>(null)
  const queued = useRef<number | null>(null)
  // finish() starts the queued turn; a ref avoids a dependency cycle.
  const startRef = useRef<(target: number, mode: Turn["mode"]) => boolean>(
    () => false
  )

  useEffect(() => {
    latest.current = options
    if (!turnRef.current) spreadRef.current = options.spread
  })

  useEffect(() => () => controls.current?.stop(), [])

  const finish = useCallback((target: number | null) => {
    controls.current = null
    turnRef.current = null
    setTurn(null)
    if (target !== null) {
      spreadRef.current = target
      latest.current.onCommit(target)
    }
    const next = queued.current
    queued.current = null
    if (next !== null && target !== null)
      startRef.current(target + next, "auto")
  }, [])

  const run = useCallback(
    (current: Turn, complete: boolean) => {
      const forwardEnd = complete ? 1 : 0
      const end = current.dir === 1 ? forwardEnd : 1 - forwardEnd
      const distance = Math.abs(end - progress.get())
      controls.current = animate(progress, end, {
        duration: Math.max(0.18, TURN_DURATION * distance),
        ease: TURN_EASE,
      })
      void controls.current.finished.then(() => {
        if (turnRef.current === current) finish(complete ? current.to : null)
      })
    },
    [finish, progress]
  )

  const start = useCallback(
    (target: number, mode: Turn["mode"]): boolean => {
      const { count, reduced, onCommit } = latest.current
      const from = spreadRef.current
      if (turnRef.current || target === from) return false
      if (target < 0 || target >= count) return false
      if (reduced) {
        spreadRef.current = target
        onCommit(target)
        return true
      }
      const dir = target > from ? 1 : -1
      const next: Turn = {
        lo: Math.min(from, target),
        hi: Math.max(from, target),
        from,
        to: target,
        dir,
        mode,
      }
      progress.set(dir === 1 ? 0 : 1)
      turnRef.current = next
      setTurn(next)
      if (mode === "auto") run(next, true)
      return true
    },
    [progress, run]
  )

  useEffect(() => {
    startRef.current = start
  }, [start])

  const go = useCallback(
    (delta: number) => {
      if (turnRef.current) {
        if (turnRef.current.mode === "auto") queued.current = delta
        return
      }
      start(spreadRef.current + delta, "auto")
    },
    [start]
  )

  const goTo = useCallback(
    (target: number) => {
      start(target, "auto")
    },
    [start]
  )

  const beginDrag = useCallback(
    (dir: 1 | -1) => start(spreadRef.current + dir, "drag"),
    [start]
  )

  const dragTo = useCallback(
    (value: number) => {
      if (turnRef.current?.mode === "drag") {
        progress.set(Math.min(1, Math.max(0, value)))
      }
    },
    [progress]
  )

  const endDrag = useCallback(
    (complete: boolean) => {
      const current = turnRef.current
      if (current?.mode === "drag") run(current, complete)
    },
    [run]
  )

  const settle = useCallback((): number | null => {
    const current = turnRef.current
    if (!current) return null
    controls.current?.stop()
    queued.current = null
    const complete = current.mode === "auto"
    progress.set(complete === (current.dir === 1) ? 1 : 0)
    finish(complete ? current.to : null)
    return complete ? current.to : current.from
  }, [finish, progress])

  return { turn, progress, go, goTo, beginDrag, dragTo, endDrag, settle }
}
