/** Anything the global player can play: a podcast episode or an audiobook sample. */
export type Track = {
  /** Stable id; saved playback positions are keyed by it. */
  id: string
  title: string
  /** Show title, author or narrator. */
  subtitle: string
  artwork: string
  src: string
  /** Page the mini player links back to. */
  href: string
  /** The cover's own color, used as a thin accent next to the artwork. */
  color?: string
  /** License credit shown in a tooltip, e.g. for Creative Commons audio. */
  attribution?: string
  durationSeconds?: number | null
}
