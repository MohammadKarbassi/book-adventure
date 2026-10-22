import { describe, expect, it } from "vitest"

import {
  episodeTrack,
  genreLabel,
  latestEpisodes,
} from "@/components/podcasts/podcast-data"
import { getPodcasts, type Episode, type Podcast } from "@/lib/podcasts"

function episode(id: string, publishedAt: string | null): Episode {
  return {
    id,
    title: `قسمت ${id}`,
    publishedAt,
    durationSeconds: 600,
    audioUrl: `https://example.com/${id}.mp3`,
    description: "",
  }
}

function podcast(id: string, episodes: Episode[]): Podcast {
  return {
    id,
    title: `پادکست ${id}`,
    author: "سازنده",
    artwork: "https://is1-ssl.mzstatic.com/a.jpg",
    genre: "Books",
    description: "",
    feedUrl: "https://example.com/feed",
    episodes,
  }
}

describe("latestEpisodes", () => {
  it("merges shows, newest first, undated last", () => {
    const shows = [
      podcast("1", [episode("a", "2026-01-01T00:00:00Z"), episode("b", null)]),
      podcast("2", [episode("c", "2026-05-01T00:00:00Z")]),
    ]
    expect(latestEpisodes(shows, 3).map(({ episode }) => episode.id)).toEqual([
      "c",
      "a",
      "b",
    ])
    expect(latestEpisodes(shows, 1)).toHaveLength(1)
  })

  it("returns 8 episodes from the real data", () => {
    expect(latestEpisodes(getPodcasts(), 8)).toHaveLength(8)
  })
})

describe("episodeTrack", () => {
  it("builds the player track for an episode", () => {
    const show = podcast("42", [episode("x", null)])
    expect(episodeTrack(show, show.episodes[0])).toEqual({
      id: "ep-42-x",
      title: "قسمت x",
      subtitle: "پادکست 42",
      artwork: show.artwork,
      src: "https://example.com/x.mp3",
      href: "/podcasts/42",
      durationSeconds: 600,
    })
  })
})

describe("genreLabel", () => {
  it("translates known genres and keeps unknown ones", () => {
    expect(genreLabel("History")).toBe("تاریخ")
    expect(genreLabel("Comedy")).toBe("Comedy")
  })

  it("has a Persian label for every genre in the data", () => {
    for (const show of getPodcasts()) {
      expect(genreLabel(show.genre)).not.toBe(show.genre)
    }
  })
})
