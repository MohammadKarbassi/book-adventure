"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"

/** Native links remain native for modified clicks and reduced motion. */
export function BookTravelLink({
  href,
  className,
  children,
  binding = "start",
}: {
  href: string
  className?: string
  children: ReactNode
  /** Logical binding in the RTL shop: Persian=start, English=end. */
  binding?: "start" | "end"
}) {
  const router = useRouter()
  const anchor = useRef<HTMLAnchorElement>(null)
  const flight = useRef<HTMLElement | null>(null)
  const navigating = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      flight.current?.remove()
    }
  }, [])
  return (
    <Link
      ref={anchor}
      href={href}
      className={className}
      data-book-card=""
      data-book-binding={binding}
      onNavigate={(event) => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
        const cover = anchor.current?.querySelector<HTMLElement>(
          '[data-slot="book-cover"]'
        )
        if (!cover || typeof cover.animate !== "function") return
        event.preventDefault()
        if (navigating.current) return
        navigating.current = true
        const rect = cover.getBoundingClientRect()
        const clone = cover.cloneNode(true) as HTMLElement
        // The portal leaves the cover's LTR/RTL ancestor; retain its binding.
        clone.dir = getComputedStyle(cover).direction
        clone.setAttribute("aria-hidden", "true")
        clone.setAttribute("data-book-flight", "")
        clone.inert = true
        Object.assign(clone.style, {
          position: "fixed",
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          margin: "0",
          zIndex: "500",
          pointerEvents: "none",
          transformOrigin: binding === "end" ? "left center" : "right center",
        })
        document.body.append(clone)
        flight.current = clone
        const animation = clone.animate(
          [
            {
              transform: `perspective(900px) rotateY(${binding === "end" ? 8 : -8}deg) translateY(-4px)`,
              opacity: 1,
            },
            {
              transform: `perspective(900px) rotateY(${binding === "end" ? 18 : -18}deg) translate3d(${binding === "end" ? 20 : -20}px,-24px,60px) scale(1.06)`,
              opacity: 0.85,
            },
          ],
          {
            duration: 240,
            easing: "cubic-bezier(0.22,1,0.36,1)",
            fill: "forwards",
          }
        )
        void animation.finished
          .catch(() => undefined)
          .then(() => {
            clone.remove()
            flight.current = null
            navigating.current = false
            if (mounted.current) router.push(href)
          })
      }}
    >
      {children}
    </Link>
  )
}
