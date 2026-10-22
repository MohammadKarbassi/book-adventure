import type { Track } from "@/components/player/types"

/** Static snapshot of NASA's official public RSS, checked 2026-10-22.
 * https://www.nasa.gov/feeds/podcasts/curious-universe
 * Artwork/audio remain attributed to NASA; no endorsement is implied.
 * The surrounding paper-world illustration is our own, not NASA artwork. */
export const HOME_PODCAST: Track = {
  id: "nasa-curious-universe-mars-dune-alpha-2026",
  title: "Encore: A Year In Mars Dune Alpha",
  subtitle: "NASA’s Curious Universe · English",
  artwork: "/home-media/nasa-curious-universe.webp",
  // The official episode page exposes this direct file too; avoid the RSS
  // tracking/CDN redirect, which failed TLS/media loading in this environment.
  src: "https://www.nasa.gov/wp-content/uploads/2026/10/a-year-in-mars-dune-alpha-2026-encore-v1.mp3",
  href: "https://www.nasa.gov/podcasts/curious-universe/encore-a-year-in-mars-dune-alpha/",
  durationSeconds: 1607,
  attribution:
    "NASA’s Curious Universe · Official NASA RSS · English · educational showcase; no endorsement",
}
