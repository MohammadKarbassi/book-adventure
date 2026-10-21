// Shared navigation data for the header, mobile menu and footer.
// Pure module: safe to import from client components.

import {
  BookOpenTextIcon,
  BrainIcon,
  BriefcaseBusinessIcon,
  CompassIcon,
  CrownIcon,
  FeatherIcon,
  GlobeIcon,
  HeadphonesIcon,
  LandmarkIcon,
  LightbulbIcon,
  LibraryBigIcon,
  PodcastIcon,
  type LucideIcon,
} from "lucide-react"

export type NavCategory = {
  slug: string
  title: string
  /** Number of books in the category. */
  count: number
}

export type NavLink = {
  href: string
  label: string
  icon: LucideIcon
}

export const mainLinks: NavLink[] = [
  { href: "/audiobooks", label: "کتاب‌های صوتی", icon: HeadphonesIcon },
  { href: "/podcasts", label: "پادکست‌ها", icon: PodcastIcon },
  { href: "/subscription", label: "اشتراک", icon: CrownIcon },
]

export const libraryLink: NavLink = {
  href: "/library",
  label: "کتابخانهٔ من",
  icon: LibraryBigIcon,
}

const categoryIcons: Record<string, LucideIcon> = {
  "story-persian": BookOpenTextIcon,
  "story-foreign": GlobeIcon,
  psychology: BrainIcon,
  literature: FeatherIcon,
  biography: CompassIcon,
  management: BriefcaseBusinessIcon,
  philosophy: LightbulbIcon,
  history: LandmarkIcon,
}

export function getCategoryIcon(slug: string): LucideIcon {
  return categoryIcons[slug] ?? BookOpenTextIcon
}

/** Active when on the link itself or one of its sub-pages. */
export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
