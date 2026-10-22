"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useReducedMotion } from "motion/react"
import {
  AArrowDownIcon,
  AArrowUpIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import { FlipBook } from "@/components/reader/flip-book"
import {
  PAGE_THEMES,
  PAGE_THEME_IDS,
  isPageTheme,
  type PageTheme,
} from "@/components/reader/page-themes"
import { useMediaQuery } from "@/components/reader/use-media-query"
import { usePageTurn } from "@/components/reader/use-page-turn"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Kbd } from "@/components/ui/kbd"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/format"
import {
  DEFAULT_FONT_STEP,
  FONT_STEPS,
  buildPages,
  clampPage,
  findPageByAnchor,
  limitPages,
  metricsFor,
  pageAnchor,
  spreadCount,
  spreadOfPage,
  spreadPages,
  spreadStart,
  type Layout,
  type ReaderBook,
} from "@/lib/reader"
import { useBookAccess, useReaderProgress } from "@/lib/store"

/** Keys handled by the reader (RTL: the left arrow reads on). */
const KEY_DELTAS: Record<string, number> = {
  ArrowLeft: 1,
  PageDown: 1,
  ArrowRight: -1,
  PageUp: -1,
}

/** Focus inside these keeps its own arrow keys (fields, menus, dialogs…). */
const OWN_KEYS =
  "input, textarea, select, [contenteditable], [role=toolbar], [role=radiogroup], [role=tablist], [role=dialog], [role=menu], [role=listbox], [role=slider]"

/** Focus in the reader's toggle group keeps the arrows, for keyboard users. */
const TOGGLES = "[data-slot=toggle-group]"

function ownsKeys(target: EventTarget | null, clicked: boolean): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest(OWN_KEYS)) return true
  // After a click on a theme, the arrows go back to turning pages.
  return !clicked && target.closest(TOGGLES) !== null
}

function paginate(
  book: ReaderBook,
  layout: Layout,
  step: number,
  canRead: boolean
) {
  return limitPages(buildPages(book, metricsFor(layout, step)), canRead)
}

export function Reader({ book }: { book: ReaderBook }) {
  const sampleOnly = useSearchParams().get("sample") === "1"
  const access = useBookAccess(book)
  const canRead = access.canRead && !sampleOnly
  const layout: Layout = useMediaQuery("(min-width: 48rem)", true)
    ? "spread"
    : "single"
  const reduced = useReducedMotion() ?? false

  const [fontStep, setFontStep] = useState(DEFAULT_FONT_STEP)
  const [theme, setTheme] = useState<PageTheme>("paper")

  const pages = useMemo(
    () => paginate(book, layout, fontStep, canRead),
    [book, layout, fontStep, canRead]
  )
  const limited = pages.at(-1)?.kind === "locked"

  // The stored page until the reader turns one; later turns and font changes
  // are kept locally too, so a re-render never shows a stale spread.
  const { page: storedPage, setPage: storePage } = useReaderProgress(book.id)
  const [localPage, setLocalPage] = useState<number | null>(null)
  const page = clampPage(localPage ?? storedPage, pages.length)
  const spread = spreadOfPage(page, layout)
  const spreads = spreadCount(pages.length, layout)

  // Crossing the md breakpoint re-paginates; keep the place by its anchor.
  const [shownLayout, setShownLayout] = useState(layout)
  if (shownLayout !== layout) {
    setShownLayout(layout)
    if (localPage !== null) {
      const before = paginate(book, shownLayout, fontStep, canRead)
      const anchor = pageAnchor(before[clampPage(localPage, before.length)])
      setLocalPage(findPageByAnchor(pages, anchor))
    }
  }

  const commit = useCallback(
    (target: number) => {
      const first = spreadStart(target, layout)
      setLocalPage(first)
      storePage(first)
    },
    [layout, storePage]
  )

  const engine = usePageTurn({
    spread,
    count: spreads,
    reduced,
    onCommit: commit,
  })
  const { go, goTo, settle } = engine

  // Whether the toggle group was last reached by pointer (not by Tab).
  const clickedToggles = useRef(false)

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Element) {
        clickedToggles.current = event.target.closest(TOGGLES) !== null
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Tab") clickedToggles.current = false
      if (event.defaultPrevented || event.altKey || event.ctrlKey) return
      if (event.metaKey || event.shiftKey) return
      if (ownsKeys(event.target, clickedToggles.current)) return
      if (event.key in KEY_DELTAS) go(KEY_DELTAS[event.key])
      else if (event.key === "Home") goTo(0)
      else if (event.key === "End") goTo(spreads - 1)
      else return
      event.preventDefault()
      event.stopPropagation()
    }
    // Capture phase: runs before a clicked toggle group sees the arrow key.
    window.addEventListener("keydown", onKeyDown, true)
    window.addEventListener("pointerdown", onPointerDown, true)
    return () => {
      window.removeEventListener("keydown", onKeyDown, true)
      window.removeEventListener("pointerdown", onPointerDown, true)
    }
  }, [go, goTo, spreads])

  function changeFont(step: number) {
    if (step < 0 || step >= FONT_STEPS.length || step === fontStep) return
    const settled = settle()
    const from = settled === null ? page : spreadStart(settled, layout)
    const anchor = pageAnchor(pages[clampPage(from, pages.length)])
    const next = paginate(book, layout, step, canRead)
    const target = spreadStart(
      spreadOfPage(findPageByAnchor(next, anchor), layout),
      layout
    )
    setFontStep(step)
    setLocalPage(target)
    storePage(target)
  }

  const shown = spreadPages(spread, layout, pages.length)
  const shownNumbers = [shown.right, shown.left].filter(
    (index): index is number => index !== null
  )
  const lastShown = shownNumbers.at(-1) ?? 0
  const indicator = `صفحهٔ ${shownNumbers
    .map((index) => formatNumber(index + 1))
    .join(" و ")} از ${formatNumber(pages.length)}`
  const percent = Math.round(((lastShown + 1) / pages.length) * 100)

  return (
    <section
      aria-label="اتاق مطالعه"
      data-ready={access.hydrated || undefined}
      className="relative flex h-[calc(100svh-4rem-1px)] min-h-[34rem] flex-col overflow-hidden bg-muted/60 in-data-[player=open]:h-[calc(100svh-8rem-1px)] md:in-data-[player=open]:h-[calc(100svh-9.5rem-1px)]"
    >
      {/* Lantern light over the desk. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_70%)]"
      />

      <div className="relative z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href={`/book/${book.id}`}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                />
              }
            >
              <ArrowRightIcon data-icon="inline-start" />
              <span className="max-sm:sr-only">بازگشت به کتاب</span>
            </TooltipTrigger>
            <TooltipContent side="bottom">بازگشت به صفحهٔ کتاب</TooltipContent>
          </Tooltip>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate font-heading text-lg leading-tight font-semibold">
              {book.title}
            </h1>
            {limited || sampleOnly ? (
              <Badge variant="accent">نمونه</Badge>
            ) : null}
          </div>

          <p
            aria-live="polite"
            className="text-sm text-muted-foreground tabular-nums"
          >
            {indicator}
          </p>

          <div className="flex items-center gap-2 max-md:w-full max-md:justify-between md:ms-2">
            <ButtonGroup aria-label="اندازهٔ متن">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="کوچک‌تر کردن متن"
                      disabled={fontStep === 0}
                      onClick={() => changeFont(fontStep - 1)}
                    />
                  }
                >
                  <AArrowDownIcon />
                </TooltipTrigger>
                <TooltipContent side="bottom">کوچک‌تر کردن متن</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="بزرگ‌تر کردن متن"
                      disabled={fontStep === FONT_STEPS.length - 1}
                      onClick={() => changeFont(fontStep + 1)}
                    />
                  }
                >
                  <AArrowUpIcon />
                </TooltipTrigger>
                <TooltipContent side="bottom">بزرگ‌تر کردن متن</TooltipContent>
              </Tooltip>
            </ButtonGroup>

            <ToggleGroup
              aria-label="رنگ صفحه"
              variant="outline"
              size="sm"
              spacing={0}
              value={[theme]}
              onValueChange={(value) => {
                const next = value[0]
                if (isPageTheme(next)) setTheme(next)
              }}
            >
              {PAGE_THEME_IDS.map((id) => (
                <ToggleGroupItem
                  key={id}
                  value={id}
                  aria-label={PAGE_THEMES[id].label}
                  className="gap-1.5"
                >
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-full ring-1 ring-foreground/20"
                    style={{ backgroundColor: PAGE_THEMES[id].swatch }}
                  />
                  {PAGE_THEMES[id].label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 px-4 py-5 sm:px-10 md:py-7">
        {/* A size container: the book fits itself into it (cqw/cqh). */}
        <div className="[container-type:size] flex size-full items-center justify-center">
          <FlipBook
            book={book}
            pages={pages}
            layout={layout}
            spread={spread}
            spreads={spreads}
            engine={engine}
            reduced={reduced}
            fontStep={fontStep}
            theme={theme}
          />
        </div>
      </div>

      <div className="relative z-10 border-t bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  disabled={spread === 0}
                  onClick={() => go(-1)}
                />
              }
            >
              <ChevronRightIcon data-icon="inline-start" />
              صفحهٔ قبل
            </TooltipTrigger>
            <TooltipContent side="top">
              ورق به عقب <Kbd>→</Kbd>
            </TooltipContent>
          </Tooltip>
          <Progress
            value={percent}
            aria-label="پیشرفت خواندن"
            aria-valuetext={`${formatNumber(percent)} درصد`}
            className="flex-1"
          />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  disabled={spread >= spreads - 1}
                  onClick={() => go(1)}
                />
              }
            >
              صفحهٔ بعد
              <ChevronLeftIcon data-icon="inline-end" />
            </TooltipTrigger>
            <TooltipContent side="top">
              ورق بعدی <Kbd>←</Kbd>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </section>
  )
}
