// Pure helpers that turn lib/podcasts data into what the pages show.

import type { Track } from "@/components/player/types"
import type { Episode, Podcast } from "@/lib/podcasts"

/** iTunes genre names in the data → Persian labels. */
const GENRE_LABELS: Record<string, string> = {
  Arts: "هنر",
  Books: "کتاب",
  Documentary: "مستند",
  Education: "آموزش",
  Fiction: "داستان",
  History: "تاریخ",
  "Kids & Family": "کودک و خانواده",
  Society: "جامعه",
  "Society & Culture": "جامعه و فرهنگ",
}

export function genreLabel(genre: string): string {
  return GENRE_LABELS[genre] ?? genre
}

export function episodeTrackId(podcastId: string, episodeId: string): string {
  return `ep-${podcastId}-${episodeId}`
}

export function episodeTrack(podcast: Podcast, episode: Episode): Track {
  return {
    id: episodeTrackId(podcast.id, episode.id),
    title: episode.title,
    subtitle: podcast.title,
    artwork: podcast.artwork,
    src: episode.audioUrl,
    href: `/podcasts/${podcast.id}`,
    durationSeconds: episode.durationSeconds,
  }
}

export type LatestEpisode = { podcast: Podcast; episode: Episode }

/** Newest episodes across all shows; episodes without a date go last. */
export function latestEpisodes(
  podcasts: Podcast[],
  count: number
): LatestEpisode[] {
  const time = (episode: Episode) =>
    episode.publishedAt ? Date.parse(episode.publishedAt) : -Infinity
  return podcasts
    .flatMap((podcast) =>
      podcast.episodes.map((episode) => ({ podcast, episode }))
    )
    .sort((a, b) => time(b.episode) - time(a.episode) || 0)
    .slice(0, count)
}
