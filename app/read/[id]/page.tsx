import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AudiobookNotice } from "@/components/reader/audiobook-notice"
import { Reader } from "@/components/reader/reader"
import { ReaderSkeleton } from "@/components/reader/reader-skeleton"
import { getBook, getBooksByType, type Book } from "@/lib/catalog"
import type { ReaderBook } from "@/lib/reader"

type Props = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return getBooksByType("ebook").map((book) => ({ id: String(book.id) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const book = getBook(id)
  if (!book) return {}
  return {
    title: `خواندن ${book.title}`,
    description: `ورق زدن نمونهٔ «${book.title}» در کتاب‌خوان ماجراجویی با کتاب.`,
  }
}

/** Only what the client reader needs, not the whole catalog record. */
function toReaderBook(book: Book): ReaderBook {
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

export default async function ReadPage({ params }: Props) {
  const { id } = await params
  const book = getBook(id)
  if (!book) notFound()

  if (book.type === "audiobook") {
    return <AudiobookNotice id={book.id} title={book.title} />
  }

  // The reader reads ?sample=1 on the client, so the page stays static.
  return (
    <Suspense fallback={<ReaderSkeleton title={book.title} />}>
      <Reader book={toReaderBook(book)} />
    </Suspense>
  )
}
