import { describe, expect, it } from "vitest"

import { getBooksByType } from "@/lib/catalog"
import {
  FONT_STEPS,
  SAMPLE_PAGE_COUNT,
  buildFlow,
  buildPages,
  clampPage,
  findPageByAnchor,
  limitPages,
  metricsFor,
  pageAnchor,
  pageBudget,
  pageCost,
  paginate,
  spreadCount,
  spreadOfPage,
  spreadPages,
  spreadStart,
  type FlowBlock,
  type Layout,
  type PageBlock,
  type ReaderBook,
} from "@/lib/reader"

const ebooks = getBooksByType("ebook")
const layouts: Layout[] = ["spread", "single"]
const steps = FONT_STEPS.map((_, index) => index)

function toReaderBook(index = 0): ReaderBook {
  const book = ebooks[index]
  return {
    id: book.id,
    title: book.title,
    authors: book.authors,
    translators: book.translators,
    publisher: book.publisher,
    published: book.published,
    image: book.image,
    color: book.color,
    description: book.description,
    free: book.free,
    inPlus: book.inPlus,
  }
}

/** Joins the slices back into the flow's text, block by block. */
function reassemble(pages: PageBlock[][]): FlowBlock[] {
  const out: FlowBlock[] = []
  let lastIndex = -1
  for (const block of pages.flat()) {
    const { index, offset, continued, continues, lead, ...rest } = block
    void offset
    void continues
    void lead
    if (index === lastIndex && continued && block.type === "prose") {
      const previous = out[out.length - 1]
      if (previous.type === "prose") previous.text += " " + block.text
      continue
    }
    out.push({ ...rest } as FlowBlock)
    lastIndex = index
  }
  return out
}

describe("paginate", () => {
  for (const layout of layouts) {
    for (const step of steps) {
      it(`fits every page and loses no text (${layout}, step ${step})`, () => {
        const metrics = metricsFor(layout, step)
        for (const book of ebooks) {
          const { about, sample } = buildFlow(book.description)
          for (const flow of [about, sample]) {
            const pages = paginate(flow, metrics)
            for (const page of pages) {
              expect(page.length).toBeGreaterThan(0)
              expect(pageCost(page, metrics)).toBeLessThanOrEqual(
                pageBudget(metrics)
              )
            }
            expect(reassemble(pages)).toEqual(flow)
          }
        }
      })
    }
  }

  it("splits long paragraphs at spaces and marks the slices", () => {
    const metrics = { charsPerLine: 10, lines: 4 }
    const text = Array.from({ length: 20 }, (_, i) => `w${i}`).join(" ")
    const pages = paginate([{ type: "prose", text }], metrics)
    expect(pages.length).toBeGreaterThan(1)
    const slices = pages.flat()
    expect(slices[0].continues).toBe(true)
    expect(slices[0].continued).toBe(false)
    expect(slices.at(-1)?.continued).toBe(true)
    expect(slices.at(-1)?.continues).toBe(false)
    for (const slice of slices) {
      if (slice.type !== "prose") throw new Error("expected prose")
      expect(slice.text.startsWith(" ")).toBe(false)
      expect(slice.text.endsWith(" ")).toBe(false)
      expect(text.slice(slice.offset, slice.offset + slice.text.length)).toBe(
        slice.text
      )
    }
  })

  it("keeps a heading with the text after it", () => {
    const metrics = { charsPerLine: 20, lines: 6 }
    const flow: FlowBlock[] = [
      { type: "prose", text: "x".repeat(20 * 4) },
      { type: "heading", level: 2, text: "حکایت" },
      { type: "prose", text: "y".repeat(40) },
    ]
    const pages = paginate(flow, metrics)
    for (const page of pages) expect(page.at(-1)?.type).not.toBe("heading")
  })

  it("sets the first paragraph after a heading without an indent", () => {
    const { about } = buildFlow(["یک", "دو"])
    const [page] = paginate(about, metricsFor("spread", 1))
    const prose = page.filter((block) => block.type === "prose")
    expect(prose[0].lead).toBe(true)
    expect(prose[1].lead).toBe(false)
  })
})

describe("buildPages", () => {
  it("starts with the cover and title, ends with the end page", () => {
    const pages = buildPages(toReaderBook(), metricsFor("spread", 1))
    expect(pages[0].kind).toBe("cover")
    expect(pages[1].kind).toBe("title")
    expect(pages[2]).toMatchObject({ kind: "text", section: "about" })
    expect(pages.at(-1)?.kind).toBe("end")
    const firstSample = pages.find(
      (page) => page.kind === "text" && page.section === "sample"
    )
    expect(firstSample?.kind === "text" && firstSample.blocks[1].type).toBe(
      "note"
    )
  })

  it("gets longer with a bigger font", () => {
    const book = toReaderBook()
    const small = buildPages(book, metricsFor("spread", 0)).length
    const large = buildPages(book, metricsFor("spread", 3)).length
    expect(large).toBeGreaterThan(small)
  })
})

describe("limitPages", () => {
  const pages = buildPages(toReaderBook(), metricsFor("spread", 1))

  it("keeps every page with access", () => {
    expect(limitPages(pages, true)).toBe(pages)
  })

  it("ends the sample with a purchase page", () => {
    const limited = limitPages(pages, false)
    expect(limited).toHaveLength(SAMPLE_PAGE_COUNT + 1)
    expect(limited.at(-1)?.kind).toBe("locked")
    expect(limited.slice(0, SAMPLE_PAGE_COUNT)).toEqual(
      pages.slice(0, SAMPLE_PAGE_COUNT)
    )
  })
})

describe("anchors", () => {
  it("maps a position to the page that shows it after re-pagination", () => {
    const book = toReaderBook()
    const small = buildPages(book, metricsFor("spread", 0))
    const large = buildPages(book, metricsFor("spread", 3))
    for (let index = 0; index < small.length; index++) {
      const anchor = pageAnchor(small[index])
      const mapped = findPageByAnchor(large, anchor)
      expect(pageAnchor(large[mapped])).toBeLessThanOrEqual(anchor)
      const next = large[mapped + 1]
      if (next) expect(pageAnchor(next)).toBeGreaterThan(anchor)
    }
    expect(findPageByAnchor(large, pageAnchor(small.at(-1)!))).toBe(
      large.length - 1
    )
  })

  it("orders anchors along the book", () => {
    const pages = buildPages(toReaderBook(), metricsFor("single", 1))
    const anchors = pages.map(pageAnchor)
    expect([...anchors].sort((a, b) => a - b)).toEqual(anchors)
  })
})

describe("spreads", () => {
  it("pairs pages right then left on desktop", () => {
    expect(spreadPages(0, "spread", 7)).toEqual({ right: 0, left: 1 })
    expect(spreadPages(3, "spread", 7)).toEqual({ right: 6, left: null })
    expect(spreadCount(7, "spread")).toBe(4)
    expect(spreadOfPage(5, "spread")).toBe(2)
    expect(spreadStart(2, "spread")).toBe(4)
  })

  it("shows one page per spread on mobile", () => {
    expect(spreadPages(3, "single", 7)).toEqual({ right: 3, left: null })
    expect(spreadCount(7, "single")).toBe(7)
    expect(spreadOfPage(5, "single")).toBe(5)
  })

  it("clamps stored pages into range", () => {
    expect(clampPage(10, 7)).toBe(6)
    expect(clampPage(-3, 7)).toBe(0)
    expect(clampPage(Number.NaN, 7)).toBe(0)
  })
})
