import { cn } from "@/lib/utils"

// Paper on the navy tile: the light theme's background, the dark theme's
// foreground (both are the site's paper color).
const paper = "fill-background dark:fill-foreground"
const paperStroke = "stroke-background dark:stroke-foreground"

/**
 * The site mark, the same drawing as app/icon.svg: a flagged peak rising out
 * of an open book on a navy tile. Theme tokens keep it right in dark mode
 * (`primary-foreground` is navy in both themes).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      data-slot="brand-mark"
      className={cn("size-8 shrink-0", className)}
    >
      <rect
        width="64"
        height="64"
        rx="14"
        // A hairline so the navy tile still reads on the dark header.
        className="fill-primary-foreground dark:stroke-foreground/20"
        strokeWidth="2"
      />
      <path d="M15 41 L32 13 L49 41 Z" className="fill-chart-2" />
      <path
        d="M27 21.2 L32 13 L37 21.2 L34.4 19.8 L32 22.4 L29.6 19.8 Z"
        className={paper}
      />
      <path
        d="M32 13 V6.5"
        className={paperStroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M32 6.5 L39 8.8 L32 11.1 Z" className="fill-primary" />
      <path
        d="M32 41 C 25 37, 17 37, 9 39 V 50 C 17 48, 25 48, 32 52 Z"
        className="fill-primary"
      />
      <path
        d="M32 41 C 39 37, 47 37, 55 39 V 50 C 47 48, 39 48, 32 52 Z"
        className="fill-[color-mix(in_oklch,var(--primary)_62%,var(--background))] dark:fill-[color-mix(in_oklch,var(--primary)_62%,var(--foreground))]"
      />
      <path
        d="M32 41 V 52"
        className="stroke-primary-foreground"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
