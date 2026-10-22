import Link from "next/link"
import { LockKeyholeIcon } from "lucide-react"

import { BookCover } from "@/components/book/book-cover"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatNumber, toPersianDigits } from "@/lib/format"
import {
  SECTION_TITLES,
  isIndented,
  type Layout,
  type PageBlock,
  type ReaderBook,
  type ReaderPage,
} from "@/lib/reader"
import { cn } from "@/lib/utils"

export type PageSide = "right" | "left"

type PaperPageProps = {
  page: ReaderPage | null
  /** Page index (the printed number is index + 1); null for a blank page. */
  index: number | null
  side: PageSide
  layout: Layout
  book: ReaderBook
  /** Back of a single page: the front's text faintly shows through. */
  showThrough?: boolean
}

/**
 * One printed page. Sizes are in container units of the page width (the
 * book sets --fs, --step and --pad-block), so it typesets the same at any
 * screen size; lib/reader.ts paginates against this layout.
 */
export function PaperPage({
  page,
  index,
  side,
  layout,
  book,
  showThrough = false,
}: PaperPageProps) {
  // The spine: between the two pages on desktop, the right edge on mobile.
  const spineAtStart = layout === "single" || side === "left"
  const folio =
    page && index !== null && page.kind !== "cover" && page.kind !== "title"
  const runningHead =
    page?.kind === "text"
      ? side === "left"
        ? SECTION_TITLES[page.section]
        : book.title
      : null

  return (
    <div
      data-slot="paper-page"
      className="@container absolute inset-0 overflow-hidden bg-(--paper) text-(--ink)"
    >
      {/* Gutter: the paper curving into the binding. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0",
          layout === "single" ? "w-[7%]" : "w-[16%]",
          spineAtStart ? "start-0" : "end-0"
        )}
        style={{
          backgroundImage: `linear-gradient(${spineAtStart ? "to left" : "to right"}, rgb(0 0 0 / calc(var(--gutter) * 1)), rgb(0 0 0 / calc(var(--gutter) * 0.25)) 30%, transparent)`,
        }}
      />
      {/* A soft sheen toward the outer edge. */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 w-[10%] opacity-60",
          spineAtStart ? "end-0" : "start-0"
        )}
        style={{
          backgroundImage: `linear-gradient(${spineAtStart ? "to left" : "to right"}, transparent, rgb(255 255 255 / 0.06))`,
        }}
      />

      <div
        className={cn(
          "relative size-full font-heading leading-loose",
          showThrough && "-scale-x-100 opacity-[0.07]"
        )}
        style={{ fontSize: "calc(var(--fs) * var(--step) * 1cqw)" }}
      >
        {runningHead ? (
          <p className="absolute inset-x-[9cqw] top-[3.4cqw] truncate text-center text-[0.62em] text-(--ink-muted)">
            {runningHead}
          </p>
        ) : null}

        {page ? <PageBody page={page} book={book} /> : null}

        {folio ? (
          <p
            className={cn(
              "absolute bottom-[3cqw] text-[0.72em] text-(--ink-muted) tabular-nums",
              spineAtStart ? "end-[9cqw]" : "start-[9cqw]"
            )}
          >
            {formatNumber(index + 1)}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function PageBody({ page, book }: { page: ReaderPage; book: ReaderBook }) {
  switch (page.kind) {
    case "cover":
      return <CoverPage book={book} />
    case "title":
      return <TitlePage book={book} />
    case "text":
      return (
        <div className="absolute inset-x-[9cqw] top-[calc(var(--pad-block)*1cqw)] bottom-[calc(var(--pad-block)*1cqw)] overflow-hidden">
          {page.blocks.map((block) => (
            <TextBlock key={`${block.index}-${block.offset}`} block={block} />
          ))}
        </div>
      )
    case "end":
      return <EndPage book={book} />
    case "locked":
      return <LockedPage book={book} />
  }
}

function TextBlock({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "heading":
      if (block.level === 1) {
        return (
          <div className="flex h-[6em] flex-col items-center justify-center gap-[0.15em] text-center">
            <span
              aria-hidden="true"
              className="text-[1.15em] leading-none text-(--ornament)"
            >
              {"❦\uFE0E"}
            </span>
            <h2 className="text-[1.45em] leading-[1.3] font-semibold">
              {block.text}
            </h2>
          </div>
        )
      }
      return (
        <div className="flex h-[3em] items-end justify-center gap-[0.6em] pb-[0.2em]">
          <span
            aria-hidden="true"
            className="h-px w-[2.5em] bg-(--ornament) opacity-40"
          />
          <h3 className="text-[1.05em] leading-[2] font-semibold">
            {block.text}
          </h3>
          <span
            aria-hidden="true"
            className="h-px w-[2.5em] bg-(--ornament) opacity-40"
          />
        </div>
      )
    case "note":
      return (
        <div className="h-[2.5em] text-center">
          <p className="inline-block rounded-full border border-current/15 px-[0.9em] text-[0.68em] leading-[1.8] text-(--ink-muted)">
            {block.text}
          </p>
        </div>
      )
    case "verse":
      return (
        <div className="py-[0.25em]">
          <p className="w-[85%] text-start">{block.lines[0]}</p>
          <p className="ms-auto w-[85%] text-end">{block.lines[1]}</p>
        </div>
      )
    case "prose":
      return (
        <p
          className={cn("text-justify", isIndented(block) && "indent-[1.5em]")}
        >
          {block.text}
        </p>
      )
  }
}

function CoverPage({ book }: { book: ReaderBook }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-[1.4em] px-[10cqw] text-center">
      <BookCover
        book={book}
        priority
        sizes="(min-width: 768px) 240px, 55vw"
        className="w-[54cqw] shadow-xl"
      />
      <div className="flex flex-col gap-[0.3em]">
        <p className="text-[1.5em] leading-[1.3] font-bold text-balance">
          {book.title}
        </p>
        <p className="text-[0.85em] leading-[1.6] text-(--ink-muted)">
          {book.authors.join("، ")}
        </p>
      </div>
    </div>
  )
}

function TitlePage({ book }: { book: ReaderBook }) {
  return (
    <div className="flex size-full flex-col items-center px-[11cqw] pt-[24cqw] pb-[10cqw] text-center">
      <span
        aria-hidden="true"
        className="text-[1.3em] leading-none text-(--ornament)"
      >
        {"❦\uFE0E"}
      </span>
      <p className="mt-[0.6em] text-[1.85em] leading-[1.25] font-bold text-balance">
        {book.title}
      </p>
      <p className="mt-[1em] text-[0.95em] leading-[1.7]">
        نوشتهٔ {book.authors.join("، ")}
      </p>
      {book.translators?.length ? (
        <p className="text-[0.9em] leading-[1.7] text-(--ink-muted)">
          ترجمهٔ {book.translators.join("، ")}
        </p>
      ) : null}
      <span
        aria-hidden="true"
        className="my-[1.2em] h-px w-[30%] bg-current opacity-20"
      />
      <p className="text-[0.82em] leading-[1.7]">{book.publisher}</p>
      {book.published ? (
        <p className="text-[0.75em] leading-[1.7] text-(--ink-muted)">
          تاریخ انتشار: {toPersianDigits(book.published)}
        </p>
      ) : null}
      <p className="mt-auto text-[0.68em] leading-[1.7] text-(--ink-muted)">
        نسخهٔ نمونه برای پروژهٔ آموزشی
      </p>
    </div>
  )
}

function EndPage({ book }: { book: ReaderBook }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-[0.8em] px-[12cqw] text-center">
      <span
        aria-hidden="true"
        className="text-[1.6em] leading-none text-(--ornament)"
      >
        {"❦\uFE0E"}
      </span>
      <h2 className="text-[1.7em] leading-[1.3] font-bold">پایان نمونه</h2>
      <p className="text-[0.85em] leading-[1.9] text-(--ink-muted)">
        این نسخه فقط چند صفحهٔ نمونه دارد. امیدواریم از همین چند ورق لذت برده
        باشید.
      </p>
      <Link
        href={`/book/${book.id}`}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-[0.6em] font-sans"
        )}
      >
        بازگشت به صفحهٔ کتاب
      </Link>
    </div>
  )
}

function LockedPage({ book }: { book: ReaderBook }) {
  return (
    <div className="flex size-full items-center justify-center px-[8cqw] font-sans">
      <Card className="w-full shadow-lg">
        <CardHeader className="justify-items-center gap-2 text-center">
          <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <LockKeyholeIcon className="size-5" />
          </span>
          <CardTitle className="text-lg leading-relaxed text-balance">
            برای خواندن ادامهٔ کتاب، آن را بخرید یا اشتراک بگیرید
          </CardTitle>
          <CardDescription className="leading-relaxed text-balance">
            {book.inPlus
              ? "تا اینجا نمونهٔ رایگان را خواندید. این کتاب در اشتراک ماجراجویی هم هست و با اشتراک بدون خرید جداگانه باز می‌شود."
              : "تا اینجا نمونهٔ رایگان را خواندید. با خرید کتاب، همهٔ صفحه‌ها برایتان باز می‌شود."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex-wrap justify-center gap-2">
          <Link href={`/book/${book.id}`} className={buttonVariants()}>
            خرید کتاب
          </Link>
          <Link
            href="/subscription"
            className={buttonVariants({ variant: "outline" })}
          >
            اشتراک بگیرید
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
