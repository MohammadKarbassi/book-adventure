export const PLANS_SECTION_ID = "plans"
export const PLUS_BOOKS_SECTION_ID = "plus-books"

/** Smooth-scrolls to a section (instant with reduced motion) and focuses it. */
export function scrollToSection(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  target.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  })
  target.focus({ preventScroll: true })
}
