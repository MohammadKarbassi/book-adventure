"use client"

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { AnimatePresence, motion, type Transition } from "motion/react"

import {
  DISCOVER_DOTS,
  INTRO_LINES,
  INTRO_SEEN_ATTR,
  INTRO_STORAGE_KEY,
  REDUCED_MOTION_QUERY,
  STEP_MS,
  nextStep,
  splitWords,
  type IntroStep,
} from "@/components/intro/intro-timeline"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useHydrated } from "@/lib/store"
import { cn } from "@/lib/utils"
import { createIntroScore } from "@/components/intro/intro-score"

const EASE_OUT: Transition["ease"] = [0.22, 1, 0.36, 1]
const EASE_IN_OUT: Transition["ease"] = [0.65, 0, 0.35, 1]

const discoverWords = splitWords(INTRO_LINES.discover)
const adventureWords = splitWords(INTRO_LINES.adventure)
const titleWords = splitWords(INTRO_LINES.title)
const subtitleLetters = Array.from(INTRO_LINES.subtitle)

// Grain: two offset dot lattices of the foreground token, barely visible.
const GRAIN = {
  backgroundImage:
    "radial-gradient(color-mix(in oklch, var(--foreground) 22%, transparent) 0.5px, transparent 1px), radial-gradient(color-mix(in oklch, var(--foreground) 14%, transparent) 0.5px, transparent 1px)",
  backgroundSize: "3px 3px, 5px 5px",
  backgroundPosition: "0 0, 1px 2px",
}

// The night sky is one full-screen gradient shared by both halves: each half
// shows its own side, so they meet seamlessly at the spine.
const SKY =
  "bg-[radial-gradient(ellipse_at_center,var(--card)_0%,var(--background)_70%)] bg-size-[200%_100%]"

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

/** false on the server and during hydration. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  )
}

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"])

function markIntroSeenInDom() {
  document.documentElement.dataset.intro = INTRO_SEEN_ATTR
}

/**
 * «ورودی سینمایی»: plays once per document load on the home page, over the
 * already rendered page. The server always renders it; the pre-paint script
 * in the root layout hides it for returning and reduced-motion visitors.
 */
const noopSubscribe = () => () => {}

function readSessionSeen(): boolean {
  try {
    return (
      sessionStorage.getItem(INTRO_STORAGE_KEY) ===
      String(performance.timeOrigin)
    )
  } catch {
    return false
  }
}

/**
 * The marker matches only this document's timeOrigin. Reloading creates a
 * fresh visit; client navigation within this document keeps it dismissed.
 */
function useSessionIntroSeen() {
  const stored = useSyncExternalStore(
    noopSubscribe,
    readSessionSeen,
    () => false
  )
  const [markedNow, setMarkedNow] = useState(false)
  const markSeen = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, String(performance.timeOrigin))
    } catch {
      // Storage blocked: the intro simply plays again next time.
    }
    setMarkedNow(true)
  }, [])
  return { seen: stored || markedNow, markSeen }
}

export function IntroOverlay() {
  const hydrated = useHydrated()
  const { seen, markSeen } = useSessionIntroSeen()
  const reducedMotion = usePrefersReducedMotion()
  const [done, setDone] = useState(false)

  // React's dev-only remount resets <html> attributes, dropping the one the
  // pre-paint script set; put it back before paint. No-op in production.
  useLayoutEffect(() => {
    if (seen || reducedMotion) markIntroSeenInDom()
  }, [seen, reducedMotion])

  const finish = useCallback(() => {
    markSeen()
    markIntroSeenInDom()
    setDone(true)
    document.getElementById("main")?.focus({ preventScroll: true })
  }, [markSeen])

  if (done || seen || reducedMotion) return null
  return <IntroStage playing={hydrated} onFinish={finish} />
}

type IntroStageProps = {
  /** false until hydration: the markup shows the opening darkness only. */
  playing: boolean
  onFinish: () => void
}

function IntroStage({ playing, onFinish }: IntroStageProps) {
  const [step, setStep] = useState<IntroStep>("discover")
  // The line on screen when the exit began (a skip keeps the current line).
  const [line, setLine] = useState<Exclude<IntroStep, "exit">>("discover")
  const dialogRef = useRef<HTMLDivElement>(null)
  const exiting = step === "exit"
  const scoreRef = useRef<ReturnType<typeof createIntroScore> | null>(null)
  const [soundOn, setSoundOn] = useState(false)

  useEffect(() => {
    if (!playing) return
    const score = createIntroScore()
    scoreRef.current = score
    void score.start().then(setSoundOn)
    return () => {
      score.stop()
      scoreRef.current = null
    }
  }, [playing])

  useEffect(() => {
    if (exiting) scoreRef.current?.stop()
  }, [exiting])

  const skip = useCallback(() => setStep("exit"), [])

  // The timeline: each step schedules the next one.
  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => {
      const next = nextStep(step)
      if (!next) {
        onFinish()
        return
      }
      if (next !== "exit") setLine(next)
      setStep(next)
    }, STEP_MS[step])
    return () => window.clearTimeout(id)
  }, [playing, step, onFinish])

  // Lock the page scroll and take focus while the intro plays.
  useEffect(() => {
    if (!playing) return
    const { body } = document
    const previous = body.style.overflow
    body.style.overflow = "hidden"
    dialogRef.current?.focus({ preventScroll: true })
    return () => {
      body.style.overflow = previous
    }
  }, [playing])

  // Any key ends it, except a modifier pressed on its own or a key that is
  // part of an IME composition.
  useEffect(() => {
    if (!playing || exiting) return
    function onKeyDown(event: KeyboardEvent) {
      if (MODIFIER_KEYS.has(event.key) || event.key === "Tab") return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("[data-intro-sound]")
      )
        return
      if (event.isComposing || event.keyCode === 229) return
      // Leave browser shortcuts (Ctrl/Cmd/Alt + key) working.
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        event.stopPropagation()
      }
      skip()
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [playing, exiting, skip])

  return (
    <div
      ref={dialogRef}
      data-intro-overlay=""
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="معرفی ماجراجویی با کتاب"
      onClick={playing ? skip : undefined}
      className={cn(
        "dark fixed inset-0 z-100 overflow-hidden text-foreground outline-none select-none perspective-[1400px]",
        exiting && "pointer-events-none"
      )}
    >
      {/* The cover: two halves that open around their outer edges. */}
      <CoverHalf side="start" open={exiting} />
      <CoverHalf side="end" open={exiting} />
      {/* The spine glints as the cover opens. */}
      <motion.div
        aria-hidden
        className="absolute inset-y-0 start-1/2 w-px bg-linear-to-b from-transparent via-primary to-transparent"
        initial={{ opacity: 0, scaleY: 0.4 }}
        animate={
          exiting
            ? { opacity: [0, 0.9, 0], scaleY: [0.4, 1, 1] }
            : { opacity: 0, scaleY: 0.4 }
        }
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={
          exiting
            ? { opacity: 0, scale: 1.04, filter: "blur(6px)" }
            : { opacity: 1, scale: 1, filter: "blur(0px)" }
        }
        transition={{ duration: 0.35, ease: "easeIn" }}
      >
        <div className="absolute inset-0 grid place-items-center px-6">
          {playing && (
            <AnimatePresence>
              {line === "discover" && <DiscoverLine key="discover" />}
              {line === "adventure" && <AdventureLine key="adventure" />}
              {line === "title" && <TitleLine key="title" />}
            </AnimatePresence>
          )}
        </div>

        <Button
          data-intro-sound=""
          type="button"
          variant="ghost"
          aria-pressed={soundOn}
          onClick={(event) => {
            event.stopPropagation()
            const score = scoreRef.current
            if (!score) return
            if (soundOn) {
              score.mute()
              setSoundOn(false)
            } else {
              void score.start().then(setSoundOn)
            }
          }}
          className="absolute start-4 bottom-4 h-9 px-3 text-muted-foreground sm:start-8 sm:bottom-8"
        >
          {soundOn ? "قطع موسیقی" : "پخش موسیقی"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          aria-keyshortcuts="Escape"
          onClick={(event) => {
            event.stopPropagation()
            skip()
          }}
          className="absolute end-4 bottom-4 h-9 gap-2 px-3 text-muted-foreground sm:end-8 sm:bottom-8"
        >
          رد شدن
          <Kbd aria-hidden dir="ltr" className="max-sm:hidden">
            Esc
          </Kbd>
        </Button>
      </motion.div>
    </div>
  )
}

type CoverHalfProps = {
  /** start is the right half in RTL; it opens around the right edge. */
  side: "start" | "end"
  open: boolean
}

function CoverHalf({ side, open }: CoverHalfProps) {
  const isStart = side === "start"
  return (
    <motion.div
      aria-hidden
      className={cn(
        SKY,
        "absolute inset-y-0 w-1/2 overflow-hidden",
        isStart ? "start-0 bg-right" : "end-0 bg-left"
      )}
      style={{ transformOrigin: isStart ? "right center" : "left center" }}
      initial={false}
      animate={open ? { rotateY: isStart ? -82 : 82, opacity: 0 } : {}}
      transition={{
        rotateY: { duration: 0.85, ease: EASE_IN_OUT },
        opacity: { duration: 0.5, delay: 0.35, ease: "easeIn" },
      }}
    >
      <div className="absolute inset-0 opacity-10" style={GRAIN} />
    </motion.div>
  )
}

const LINE = "col-start-1 row-start-1 text-center font-heading"
const GLOW = "pointer-events-none col-start-1 row-start-1 -z-10 rounded-full"

/** Line 1: a lantern sweeps right to left and lights each word in turn. */
function DiscoverLine() {
  return (
    <motion.div
      className={cn(LINE, "isolate grid place-items-center")}
      exit={{ opacity: 0, x: -96, filter: "blur(6px)" }}
      transition={{ duration: 0.45, ease: "easeIn" }}
    >
      <motion.div
        aria-hidden
        className={cn(
          GLOW,
          "aspect-square w-[min(34rem,90vw)] bg-radial from-primary/25 via-primary/5 via-45% to-transparent to-70%"
        )}
        initial={{ x: "70vw", opacity: 0 }}
        animate={{ x: "-70vw", opacity: [0, 1, 1, 0] }}
        transition={{
          x: { duration: 1.6, ease: [0.3, 0.1, 0.7, 0.9] },
          opacity: { duration: 1.6, times: [0, 0.2, 0.75, 1] },
        }}
      />
      <p className="col-start-1 row-start-1 text-4xl leading-normal text-foreground/90 sm:text-5xl md:text-6xl">
        {discoverWords.map((word, index) => (
          <Fragment key={index}>
            {index > 0 && " "}
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: 0.2 + index * 0.15,
                duration: 0.55,
                ease: EASE_OUT,
              }}
            >
              {word}
            </motion.span>
          </Fragment>
        ))}
        {Array.from({ length: DISCOVER_DOTS }, (_, index) => (
          <motion.span
            key={`dot-${index}`}
            className="inline-block text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95 + index * 0.16, duration: 0.15 }}
          >
            .
          </motion.span>
        ))}
      </p>
    </motion.div>
  )
}

/** Line 2: comes forward from the depth, word by word. */
function AdventureLine() {
  return (
    <motion.p
      className={cn(LINE, "text-4xl leading-normal sm:text-5xl md:text-6xl")}
      exit={{ opacity: 0, scale: 1.08, filter: "blur(8px)" }}
      transition={{ duration: 0.4, ease: "easeIn" }}
    >
      {adventureWords.map((word, index) => (
        <Fragment key={index}>
          {index > 0 && " "}
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, scale: 0.85, x: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
            transition={{
              delay: 0.35 + index * 0.14,
              duration: 0.6,
              ease: EASE_OUT,
            }}
          >
            {word}
          </motion.span>
        </Fragment>
      ))}
    </motion.p>
  )
}

/** Line 3: the title lands with a spring; «Book Adventure» types in below. */
function TitleLine() {
  return (
    <div className={cn(LINE, "isolate grid place-items-center")}>
      <motion.div
        aria-hidden
        className={cn(
          GLOW,
          "h-[min(24rem,60vw)] w-[min(44rem,85vw)] bg-radial from-primary/20 to-transparent to-70%"
        )}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.9, ease: EASE_OUT }}
      />
      <div className="col-start-1 row-start-1 flex flex-col items-center gap-3">
        <p className="text-5xl leading-tight font-bold text-primary text-shadow-[0_0_32px_color-mix(in_oklch,var(--primary)_45%,transparent)] sm:text-7xl md:text-8xl">
          {titleWords.map((word, index) => (
            <Fragment key={index}>
              {index > 0 && " "}
              <motion.span
                className="inline-block"
                initial={{
                  opacity: 0,
                  y: 22,
                  scale: 0.92,
                  filter: "blur(6px)",
                }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{
                  default: {
                    type: "spring",
                    stiffness: 170,
                    damping: 15,
                    delay: 0.12 + index * 0.1,
                  },
                  opacity: { duration: 0.4, delay: 0.12 + index * 0.1 },
                  filter: { duration: 0.45, delay: 0.12 + index * 0.1 },
                }}
              >
                {word}
              </motion.span>
            </Fragment>
          ))}
        </p>
        <p
          dir="ltr"
          className="font-sans text-xs font-medium tracking-[0.5em] text-muted-foreground uppercase sm:text-sm"
        >
          {subtitleLetters.map((letter, index) => (
            <motion.span
              key={index}
              className="inline-block whitespace-pre"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + index * 0.04, duration: 0.18 }}
            >
              {letter}
            </motion.span>
          ))}
        </p>
      </div>
    </div>
  )
}
