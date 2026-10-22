import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdventureJourney } from "@/components/adventures/adventure-journey"
import {
  getCategoryMap,
  toAdventureView,
} from "@/components/adventures/adventure-views"
import { getAdventureByBookId, getAdventures } from "@/lib/adventures"
import { getPodcasts } from "@/lib/podcasts"

type AdventurePageProps = { params: Promise<{ bookId: string }> }

// Routes use the book id: adventure numbers depend on the reader's order.
export const dynamicParams = false

export function generateStaticParams() {
  return getAdventures().map((adventure) => ({
    bookId: String(adventure.book.id),
  }))
}

function findAdventure(bookId: string) {
  return /^\d+$/.test(bookId) ? getAdventureByBookId(Number(bookId)) : undefined
}

export async function generateMetadata({
  params,
}: AdventurePageProps): Promise<Metadata> {
  const adventure = findAdventure((await params).bookId)
  if (!adventure) return {}
  const title = `ماجراجویی: ${adventure.copy.name}`
  return {
    title,
    description: adventure.copy.tagline,
    alternates: { canonical: `/adventures/${adventure.book.id}` },
    openGraph: {
      title,
      description: adventure.copy.tagline,
      images: [{ url: adventure.book.image, alt: adventure.book.title }],
    },
  }
}

export default async function AdventurePage({ params }: AdventurePageProps) {
  const adventure = findAdventure((await params).bookId)
  if (!adventure) notFound()

  return (
    <AdventureJourney
      adventures={getAdventures().map(toAdventureView)}
      categoryOf={getCategoryMap()}
      initialId={adventure.book.id}
      podcast={
        getPodcasts().map(({ id, title, artwork }) => ({
          id,
          title,
          artwork,
        }))[0]
      }
    />
  )
}
