import type { Track } from "@/components/player/types"

/** Static snapshot of NASA's official episode page, checked 2026-10-23.
 * https://www.nasa.gov/podcasts/houston-we-have-a-podcast/reflections-after-artemis-ii/
 * Artwork/audio remain attributed to NASA; no endorsement is implied.
 * Local cover files were supplied by the user; source links identify each show. */
export const HOME_PODCAST: Track = {
  id: "nasa-houston-artemis-reflections-441",
  title: "Reflections After Artemis II",
  subtitle: "Houston We Have a Podcast · English",
  artwork: "/home-media/houston-podcast.webp",
  // The official episode page exposes this direct file too; avoid the RSS
  // tracking/CDN redirect, which failed TLS/media loading in this environment.
  src: "https://www.nasa.gov/wp-content/uploads/2026/10/ep441-reflections-after-artemis-ii.mp3",
  href: "https://www.nasa.gov/podcasts/houston-we-have-a-podcast/reflections-after-artemis-ii/",
  attribution:
    "Houston We Have a Podcast · NASA · English · educational showcase; no endorsement",
}

/** Separate English NASA listening sample under the unfolding poster. */
export const HOME_NASA_SAMPLE: Track = {
  id: "nasa-curious-universe-mars-dune-alpha-2026",
  title: "Encore: A Year In Mars Dune Alpha",
  subtitle: "NASA’s Curious Universe · English",
  artwork: "/home-media/nasa-curious-universe.webp",
  src: "https://www.nasa.gov/wp-content/uploads/2026/10/a-year-in-mars-dune-alpha-2026-encore-v1.mp3",
  href: "https://www.nasa.gov/podcasts/curious-universe/encore-a-year-in-mars-dune-alpha/",
  attribution:
    "NASA’s Curious Universe · NASA · English · educational showcase; no endorsement",
}
