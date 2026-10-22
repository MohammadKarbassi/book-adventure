import { createElement } from "react"
import type { LucideProps } from "lucide-react"

import { getCategoryIcon } from "@/components/site/nav-config"

/** The lucide icon mapped to a category slug (see nav-config). */
export function CategoryIcon({
  slug,
  ...props
}: LucideProps & { slug: string }) {
  return createElement(getCategoryIcon(slug), { "aria-hidden": true, ...props })
}
