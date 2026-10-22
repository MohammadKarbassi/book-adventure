"use client"

// The site-wide audio player. One <audio> element lives here; the root layout
// keeps this provider mounted across client navigations, so playback goes on
// while the visitor browses.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { toast } from "sonner"

import {
  RATE_KEY,
  SKIP_SECONDS,
  clampTime,
  clearPosition,
  isPlaybackRate,
  readPosition,
  resumePosition,
  writePosition,
} from "@/components/player/progress"
import type { Track } from "@/components/player/types"
import { storage } from "@/lib/storage"

type PlayerControls = {
  current: Track | null
  playing: boolean
  buffering: boolean
  rate: number
  play: (track: Track) => void
  toggle: () => void
  pause: () => void
  seek: (seconds: number) => void
  skip: (delta: number) => void
  setRate: (rate: number) => void
  close: () => void
}

type PlayerTime = { position: number; duration: number }

export type Player = PlayerControls & PlayerTime

const ControlsContext = createContext<PlayerControls | null>(null)
const TimeContext = createContext<PlayerTime | null>(null)

/** Saved positions are refreshed this often while playing. */
const SAVE_INTERVAL_MS = 5000

const subscribeRate = (callback: () => void) =>
  storage.subscribe(RATE_KEY, callback)
const readRate = () => storage.read(RATE_KEY, 1, isPlaybackRate)
const serverRate = () => 1

/** Space should still type, press buttons and move sliders where it does. */
function handlesSpace(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return (
    target.closest(
      'input, textarea, select, button, a[href], summary, [contenteditable=""], [contenteditable="true"], [role="button"], [role="slider"], [role="option"], [role="combobox"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role^="menuitem"]'
    ) !== null
  )
}

function finiteDuration(audio: HTMLAudioElement, track: Track | null): number {
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    return audio.duration
  }
  return track?.durationSeconds ?? 0
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  // Mirrors `current` for event handlers and stable callbacks.
  const currentRef = useRef<Track | null>(null)
  const pendingSeekRef = useRef(0)
  const lastSaveRef = useRef(0)

  const [current, setCurrent] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  // The stored rate, unless storage is unavailable and the write was lost.
  const storedRate = useSyncExternalStore(subscribeRate, readRate, serverRate)
  const [rateOverride, setRateOverride] = useState<number | null>(null)
  const rate = rateOverride ?? storedRate

  const save = useCallback(() => {
    const audio = audioRef.current
    const track = currentRef.current
    // Before the resume seek lands, currentTime still reads 0.
    if (!audio || !track || pendingSeekRef.current > 0) return
    lastSaveRef.current = Date.now()
    writePosition(storage, track.id, audio.currentTime)
  }, [])

  const startPlayback = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch((error: unknown) => {
      // A newer src or pause() interrupted it: nothing went wrong.
      if (error instanceof DOMException && error.name === "AbortError") return
      // Load failures also fire "error", which shows the toast.
      setPlaying(false)
      setBuffering(false)
    })
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentRef.current) return
    if (audio.paused) startPlayback(audio)
    else audio.pause()
  }, [startPlayback])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const play = useCallback(
    (track: Track) => {
      const audio = audioRef.current
      if (!audio) return
      if (currentRef.current?.id === track.id) {
        toggle()
        return
      }
      save()
      currentRef.current = track
      const start = resumePosition(
        readPosition(storage, track.id),
        track.durationSeconds
      )
      pendingSeekRef.current = start
      lastSaveRef.current = Date.now()
      setCurrent(track)
      setPosition(start)
      setDuration(track.durationSeconds ?? 0)
      setBuffering(true)
      audio.src = track.src
      startPlayback(audio)
    },
    [save, startPlayback, toggle]
  )

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio || !currentRef.current) return
    const target = clampTime(seconds, finiteDuration(audio, currentRef.current))
    if (audio.readyState === HTMLMediaElement.HAVE_NOTHING) {
      pendingSeekRef.current = target
    } else {
      audio.currentTime = target
    }
    setPosition(target)
  }, [])

  const skip = useCallback(
    (delta: number) => {
      const audio = audioRef.current
      if (!audio) return
      seek(audio.currentTime + delta)
    },
    [seek]
  )

  const setRate = useCallback((next: number) => {
    setRateOverride(next)
    if (storage.write(RATE_KEY, next)) setRateOverride(null)
  }, [])

  const close = useCallback(() => {
    const audio = audioRef.current
    save()
    currentRef.current = null
    pendingSeekRef.current = 0
    if (audio) {
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
    }
    setCurrent(null)
    setPlaying(false)
    setBuffering(false)
    setPosition(0)
    setDuration(0)
  }, [save])

  // A new src resets playbackRate to defaultPlaybackRate, so set both.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.defaultPlaybackRate = rate
    audio.playbackRate = rate
  }, [rate])

  // Keep the position when the tab closes or reloads mid-interval.
  useEffect(() => {
    window.addEventListener("pagehide", save)
    return () => window.removeEventListener("pagehide", save)
  }, [save])

  // Space toggles playback unless the focused control uses it itself.
  const hasTrack = current !== null
  useEffect(() => {
    if (!hasTrack) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" && event.key !== " ") return
      if (event.defaultPrevented || event.repeat) return
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (handlesSpace(event.target)) return
      event.preventDefault()
      toggle()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [hasTrack, toggle])

  // Media Session: lock screen, headphones and media keys.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => toggle()],
      ["pause", () => pause()],
      [
        "seekbackward",
        (details) => skip(-(details.seekOffset ?? SKIP_SECONDS)),
      ],
      ["seekforward", (details) => skip(details.seekOffset ?? SKIP_SECONDS)],
      [
        "seekto",
        (details) => {
          if (details.seekTime != null) seek(details.seekTime)
        },
      ],
    ]
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch {
        // This browser doesn't support the action.
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null)
        } catch {
          // Same as above.
        }
      }
    }
  }, [pause, seek, skip, toggle])

  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    navigator.mediaSession.metadata = current
      ? new MediaMetadata({
          title: current.title,
          artist: current.subtitle,
          album: "ماجراجویی با کتاب",
          artwork: [{ src: current.artwork }],
        })
      : null
  }, [current])

  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    navigator.mediaSession.playbackState = !hasTrack
      ? "none"
      : playing
        ? "playing"
        : "paused"
  }, [hasTrack, playing])

  function updateDuration() {
    const audio = audioRef.current
    if (audio) setDuration(finiteDuration(audio, currentRef.current))
  }

  function onLoadedMetadata() {
    const audio = audioRef.current
    if (!audio) return
    updateDuration()
    const target = pendingSeekRef.current
    pendingSeekRef.current = 0
    if (target > 0) {
      audio.currentTime = clampTime(target, finiteDuration(audio, null))
    }
  }

  function onTimeUpdate() {
    const audio = audioRef.current
    if (!audio || !currentRef.current || pendingSeekRef.current > 0) return
    setPosition(audio.currentTime)
    if (!audio.paused && Date.now() - lastSaveRef.current >= SAVE_INTERVAL_MS) {
      save()
    }
  }

  function onPause() {
    setPlaying(false)
    setBuffering(false)
    save()
  }

  function onEnded() {
    const audio = audioRef.current
    const track = currentRef.current
    setPlaying(false)
    setBuffering(false)
    setPosition(0)
    if (track) clearPosition(storage, track.id)
    if (audio) audio.currentTime = 0
  }

  function onError() {
    const audio = audioRef.current
    // Clearing the src on close is not a failure.
    if (!audio || !currentRef.current || !audio.getAttribute("src")) return
    setPlaying(false)
    setBuffering(false)
    toast.error("پخش این فایل ممکن نیست", {
      description: "اتصال اینترنت را بررسی کنید یا کمی بعد دوباره امتحان کنید.",
    })
  }

  const controls = useMemo<PlayerControls>(
    () => ({
      current,
      playing,
      buffering,
      rate,
      play,
      toggle,
      pause,
      seek,
      skip,
      setRate,
      close,
    }),
    [
      current,
      playing,
      buffering,
      rate,
      play,
      toggle,
      pause,
      seek,
      skip,
      setRate,
      close,
    ]
  )
  const time = useMemo<PlayerTime>(
    () => ({ position, duration }),
    [position, duration]
  )

  return (
    <ControlsContext value={controls}>
      <TimeContext value={time}>
        {children}
        <audio
          ref={audioRef}
          preload="metadata"
          hidden
          onPlay={() => setPlaying(true)}
          onPause={onPause}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onLoadedMetadata={onLoadedMetadata}
          onDurationChange={updateDuration}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          onError={onError}
        />
      </TimeContext>
    </ControlsContext>
  )
}

function useRequired<T>(value: T | null, name: string): T {
  if (value === null) {
    throw new Error(`${name} must be used inside <PlayerProvider>`)
  }
  return value
}

/** State and actions without the clock: no re-render on every timeupdate. */
export function usePlayerControls(): PlayerControls {
  return useRequired(useContext(ControlsContext), "usePlayerControls")
}

export function usePlayer(): Player {
  const controls = useRequired(useContext(ControlsContext), "usePlayer")
  const time = useRequired(useContext(TimeContext), "usePlayer")
  return useMemo(() => ({ ...controls, ...time }), [controls, time])
}
