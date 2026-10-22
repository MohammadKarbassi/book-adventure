import type { Track } from "@/components/player/types"

/** Static snapshot of NASA's official episode page, checked 2026-10-23.
 * https://www.nasa.gov/podcasts/houston-we-have-a-podcast/reflections-after-artemis-ii/
 * Artwork/audio remain attributed to NASA; no endorsement is implied.
 * The surrounding paper-world illustration is our own, not NASA artwork. */
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
