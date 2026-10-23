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
  LanguagesIcon,
  LightbulbIcon,
  LibraryBigIcon,
  PodcastIcon,
  RouteIcon,
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
  /** Header: shown from 1280px only, so the 1024px bar never overflows. */
  wideOnly?: boolean
}

export const mainLinks: NavLink[] = [
  {
    href: "/#adventure-shelf",
    label: "سفر ماجراجویی",
    icon: RouteIcon,
    wideOnly: true,
  },
  { href: "/audiobooks", label: "کتاب‌های صوتی", icon: HeadphonesIcon },
  { href: "/podcasts", label: "پادکست‌ها", icon: PodcastIcon },
  { href: "/foreign", label: "کتاب‌های خارجی", icon: LanguagesIcon },
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
  // Hash links point into the home page: they are «active» on the adventure
  // routes the section leads to, never on `/` itself.
  if (href.includes("#")) return pathname.startsWith("/adventures/")
  return pathname === href || pathname.startsWith(`${href}/`)
}
