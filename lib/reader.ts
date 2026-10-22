// Pure helpers for the book reader: the page list, text pagination by a
// character budget, sample-mode locking and two-page spreads. No React here.

import {
  SAMPLE_SOURCE_NOTE,
  SAMPLE_TITLE,
  sampleText,
  type SampleBlock,
} from "@/data/sample-text"

/** What the reader needs from a catalog Book (client-safe, serializable). */
export type ReaderBook = {
  id: number
  title: string
  authors: string[]
  translators?: string[]
  publisher: string
  published?: string
  image: string
  color: { dominant: string; isDark: boolean }
  description: string[]
  free: boolean
  inPlus: boolean
}

export type Layout = "spread" | "single"

/** A block of the text flow, before pagination. */
export type FlowBlock =
  /** level 1 opens a section (ornament above), level 2 is a story title. */
  | { type: "heading"; level: 1 | 2; text: string }
  | { type: "note"; text: string }
  | { type: "prose"; text: string }
  | { type: "verse"; lines: [string, string] }

/** A block placed on a page; prose may be a slice of a longer paragraph. */
export type PageBlock = FlowBlock & {
  /** Index of the source block in the flow. */
  index: number
  /** For prose slices: character offset of this slice in the source text. */
  offset: number
  /** Prose that starts mid-paragraph (no indent). */
  continued: boolean
  /** Prose that goes on to the next page. */
  continues: boolean
  /** First paragraph of a section (no indent). */
  lead: boolean
}

export type Section = "about" | "sample"

export type ReaderPage =
  | { kind: "cover" }
  | { kind: "title" }
  | { kind: "text"; section: Section; blocks: PageBlock[] }
  | { kind: "end" }
  | { kind: "locked" }

export const SECTION_TITLES: Record<Section, string> = {
  about: "دربارهٔ این کتاب",
  sample: SAMPLE_TITLE,
}

/** Pages readable without access (cover, title, about, first sample pages). */
export const SAMPLE_PAGE_COUNT = 6

// Typesetting model, in body lines. The page CSS (components/reader) sizes
// everything in container units of the page width, so a page holds the same
// text at any screen size; only the font step and the layout change it.

export type PageMetrics = {
  /** Average characters that fit on one justified body line. */
  charsPerLine: number
  /** Body lines that fit in the text area. */
  lines: number
}

/** Font size multipliers for the A−/A+ buttons. */
export const FONT_STEPS = [0.9, 1, 1.12, 1.25] as const
export const DEFAULT_FONT_STEP = 1

/** Body line height, in em (leading-loose). */
export const LINE_HEIGHT = 2

export type PageGeometry = {
  /** Page width / height. */
  aspect: number
  /** Body font size at step 1, in % of the page width (cqw). */
  fontSize: number
  /** Text area width, in % of the page width. */
  measure: number
} & PageMetrics

export const PAGE_GEOMETRY: Record<Layout, PageGeometry> = {
  spread: {
    aspect: 2 / 3,
    fontSize: 4.7,
    measure: 82,
    lines: 14,
    charsPerLine: 45,
  },
  single: {
    aspect: 3 / 5,
    fontSize: 5.4,
    measure: 82,
    lines: 13,
    charsPerLine: 39,
  },
}

/** Height of the text area at step 1, in % of the page width. */
export function textAreaHeight(layout: Layout): number {
  const { fontSize, lines } = PAGE_GEOMETRY[layout]
  return fontSize * LINE_HEIGHT * lines
}

export function metricsFor(layout: Layout, fontStep: number): PageMetrics {
  const scale = FONT_STEPS[clampIndex(fontStep, FONT_STEPS.length)]
  const base = PAGE_GEOMETRY[layout]
  return {
    charsPerLine: Math.floor(base.charsPerLine / scale),
    lines: Math.floor(base.lines / scale),
  }
}

/** The text area of a page, in characters. */
export function pageBudget(metrics: PageMetrics): number {
  return metrics.charsPerLine * metrics.lines
}

// Line costs of the non-prose blocks (see the matching CSS in page-content).
const HEADING_LINES = { 1: 3, 2: 1.5 } as const
const NOTE_LINES = 1.25
/** Hemistichs are set on 85% of the measure, staggered. */
const VERSE_MEASURE = 0.85
const VERSE_GAP_LINES = 0.25
/** The first-line indent of a paragraph, in characters. */
const INDENT_CHARS = 3

function proseLines(text: string, indented: boolean, m: PageMetrics) {
  const length = text.length + (indented ? INDENT_CHARS : 0)
  return Math.max(1, Math.ceil(length / m.charsPerLine))
}

function blockLines(block: PageBlock, m: PageMetrics): number {
  switch (block.type) {
    case "heading":
      return HEADING_LINES[block.level]
    case "note":
      return NOTE_LINES
    case "verse": {
      const measure = Math.floor(m.charsPerLine * VERSE_MEASURE)
      return (
        block.lines.reduce(
          (sum, line) => sum + Math.max(1, Math.ceil(line.length / measure)),
          0
        ) + VERSE_GAP_LINES
      )
    }
    case "prose":
      return proseLines(block.text, isIndented(block), m)
  }
}

export function isIndented(block: PageBlock): boolean {
  return block.type === "prose" && !block.lead && !block.continued
}

/** Characters a page's blocks take up, counting whole lines. */
export function pageCost(blocks: PageBlock[], m: PageMetrics): number {
  const lines = blocks.reduce((sum, block) => sum + blockLines(block, m), 0)
  return Math.ceil(lines * m.charsPerLine)
}

/** The about section, then the Golestan sample. */
export function buildFlow(description: string[]): {
  about: FlowBlock[]
  sample: FlowBlock[]
} {
  const about: FlowBlock[] = [
    { type: "heading", level: 1, text: SECTION_TITLES.about },
    ...description
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text): FlowBlock => ({ type: "prose", text })),
  ]
  const sample: FlowBlock[] = [
    { type: "heading", level: 1, text: SAMPLE_TITLE },
    { type: "note", text: SAMPLE_SOURCE_NOTE },
    ...sampleText.map(fromSample),
  ]
  return { about, sample }
}

function fromSample(block: SampleBlock): FlowBlock {
  if (block.type === "heading") return { ...block, level: 2 }
  return block
}

/** Minimum lines of a split paragraph on each side of the page break. */
const MIN_SPLIT_LINES = 2

/**
 * Fills pages with blocks without exceeding `pageBudget(metrics)`. Long
 * paragraphs are split at a space (the space itself is dropped and restored
 * when the slices are joined); headings stay with the block after them.
 */
export function paginate(flow: FlowBlock[], m: PageMetrics): PageBlock[][] {
  const pages: PageBlock[][] = []
  let page: PageBlock[] = []
  let used = 0
  let afterHeading = false

  const flush = () => {
    if (page.length > 0) pages.push(page)
    page = []
    used = 0
  }

  flow.forEach((source, index) => {
    const base = { index, offset: 0, continued: false, continues: false }
    // The first paragraph after a heading is set without an indent.
    const lead = afterHeading && source.type === "prose"
    if (source.type === "heading") afterHeading = true
    else if (source.type !== "note") afterHeading = false

    if (source.type !== "prose") {
      const block: PageBlock = { ...source, ...base, lead: false }
      let lines = blockLines(block, m)
      // Keep a heading or note with at least two lines of what follows.
      if (source.type !== "verse") lines += MIN_SPLIT_LINES
      if (used + lines > m.lines) flush()
      page.push(block)
      used += blockLines(block, m)
      return
    }

    let text = source.text
    let offset = 0
    for (;;) {
      const block: PageBlock = {
        ...source,
        ...base,
        text,
        offset,
        continued: offset > 0,
        lead: lead && offset === 0,
      }
      const lines = proseLines(text, isIndented(block), m)
      const room = m.lines - used
      if (lines <= room) {
        page.push(block)
        used += lines
        return
      }
      // Leave at least two lines on each side of the break when possible;
      // an empty page takes as much as fits.
      const fitLines = Math.floor(room)
      const take =
        page.length === 0
          ? Math.max(1, Math.min(fitLines, lines - MIN_SPLIT_LINES))
          : Math.min(fitLines, lines - MIN_SPLIT_LINES)
      const cut =
        take >= MIN_SPLIT_LINES || page.length === 0
          ? findBreak(text, take * m.charsPerLine - indentOf(block))
          : -1
      if (cut <= 0) {
        if (page.length > 0) {
          flush()
          continue
        }
        // One unbreakable run longer than a page: give it its own page.
        page.push(block)
        flush()
        return
      }
      page.push({ ...block, text: text.slice(0, cut), continues: true })
      flush()
      offset += cut + 1
      text = text.slice(cut + 1)
    }
  })
  flush()
  return pages
}

function indentOf(block: PageBlock) {
  return isIndented(block) ? INDENT_CHARS : 0
}

/** Index of the last space at or before `limit` (−1 if none). */
function findBreak(text: string, limit: number): number {
  if (limit <= 0) return -1
  return text.lastIndexOf(" ", Math.min(limit, text.length - 1))
}

/** All pages of the book at the given metrics. */
export function buildPages(book: ReaderBook, m: PageMetrics): ReaderPage[] {
  const { about, sample } = buildFlow(book.description)
  const toPages = (section: Section, flow: FlowBlock[]) =>
    paginate(flow, m).map((blocks): ReaderPage => ({
      kind: "text",
      section,
      blocks,
    }))
  return [
    { kind: "cover" },
    { kind: "title" },
    ...toPages("about", about),
    ...toPages("sample", sample),
    { kind: "end" },
  ]
}

/** Without access only the first pages are readable, then a purchase page. */
export function limitPages(pages: ReaderPage[], canRead: boolean) {
  if (canRead || pages.length <= SAMPLE_PAGE_COUNT) return pages
  return [
    ...pages.slice(0, SAMPLE_PAGE_COUNT),
    { kind: "locked" } satisfies ReaderPage,
  ]
}

// Reading position, so a re-pagination (font size) keeps the reader's place.

/**
 * A sortable position: front matter first, then the text by section, block
 * and character offset, then the closing pages.
 */
export function pageAnchor(page: ReaderPage): number {
  switch (page.kind) {
    case "cover":
      return 0
    case "title":
      return 1
    case "text": {
      const first = page.blocks[0]
      const section = page.section === "about" ? 1 : 2
      return section * 1e9 + first.index * 1e5 + first.offset
    }
    case "end":
    case "locked":
      return 9e9
  }
}

/** The page that shows `anchor`: the last page starting at or before it. */
export function findPageByAnchor(pages: ReaderPage[], anchor: number): number {
  let found = 0
  pages.forEach((page, index) => {
    if (pageAnchor(page) <= anchor) found = index
  })
  return found
}

// Spreads: on desktop pages pair up (right page first, as Persian books
// read); on mobile every page is its own spread.

export function pagesPerSpread(layout: Layout): 1 | 2 {
  return layout === "spread" ? 2 : 1
}

export function spreadCount(pageCount: number, layout: Layout): number {
  return Math.max(1, Math.ceil(pageCount / pagesPerSpread(layout)))
}

export function spreadOfPage(page: number, layout: Layout): number {
  return Math.floor(Math.max(0, page) / pagesPerSpread(layout))
}

/** Page indexes of a spread; `null` stands for a blank page past the end. */
export function spreadPages(
  spread: number,
  layout: Layout,
  pageCount: number
): { right: number | null; left: number | null } {
  const at = (index: number) => (index >= 0 && index < pageCount ? index : null)
  if (layout === "single") return { right: at(spread), left: null }
  return { right: at(spread * 2), left: at(spread * 2 + 1) }
}

/** First page index of a spread. */
export function spreadStart(spread: number, layout: Layout): number {
  return spread * pagesPerSpread(layout)
}

/** Keeps a stored page inside the readable range. */
export function clampPage(page: number, pageCount: number): number {
  if (!Number.isFinite(page)) return 0
  return Math.min(Math.max(0, Math.floor(page)), Math.max(0, pageCount - 1))
}

function clampIndex(index: number, length: number) {
  return Math.min(Math.max(0, Math.round(index)), length - 1)
}
