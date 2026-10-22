// Builds the player track for an audiobook on the server: we have no real
// audiobook audio, so every book plays a free Internet Archive sample.

import type { Track } from "@/components/player/types"
import { getSampleForBook, type AudioSample } from "@/lib/audio-samples"

type TrackBook = {
  id: number
  title: string
  authors: string[]
  narrators?: string[]
  image: string
  color: { dominant: string }
}

export function buildBookTrack(
  book: TrackBook,
  sample: AudioSample = getSampleForBook(book.id)
): Track {
  const people = book.narrators?.length ? book.narrators : book.authors
  return {
    id: `book-${book.id}`,
    title: book.title,
    subtitle: people.join("، "),
    artwork: book.image,
    src: sample.audioUrl,
    href: `/book/${book.id}`,
    color: book.color.dominant,
    attribution: `${sample.title} — ${sample.attribution} (${sample.license})`,
    durationSeconds: sample.durationSeconds,
  }
}
