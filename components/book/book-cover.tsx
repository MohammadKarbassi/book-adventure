import Image from "next/image"
import { BookIcon } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import type { BookColor } from "@/lib/catalog"
import { cn } from "@/lib/utils"

// Persian books bind on the right, so the spine is the inline-start edge:
// a tight radius there and a softer one on the outer (inline-end) edge.
const bookCoverVariants = cva(
  "relative isolate aspect-2/3 shrink-0 overflow-hidden rounded-s-[3px] rounded-e-md bg-muted shadow-md ring-1 ring-foreground/10",
  {
    variants: {
      size: {
        sm: "w-12",
        md: "w-28",
        lg: "w-44",
        xl: "w-64 rounded-e-lg shadow-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const imageSizes = {
  sm: "48px",
  md: "112px",
  lg: "176px",
  xl: "256px",
} as const

type BookCoverProps = VariantProps<typeof bookCoverVariants> & {
  /** `image: null` (some Open Library works) shows a plain titled cover. */
  book: { title: string; image: string | null; color?: BookColor }
  /** Load eagerly with high priority (above-the-fold covers). */
  priority?: boolean
  /** Overrides the `sizes` attribute when the cover is sized by its parent. */
  sizes?: string
  className?: string
}

export function BookCover({
  book,
  size,
  priority = false,
  sizes,
  className,
}: BookCoverProps) {
  return (
    <div
      data-slot="book-cover"
      className={cn(bookCoverVariants({ size }), className)}
      style={book.color ? { backgroundColor: book.color.dominant } : undefined}
    >
      {book.image ? (
        <Image
          src={book.image}
          alt={book.title}
          fill
          sizes={sizes ?? imageSizes[size ?? "md"]}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={book.title}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary p-3 text-center text-secondary-foreground"
        >
          <BookIcon aria-hidden="true" className="size-1/4 opacity-60" />
          {size === "sm" ? null : (
            <span
              aria-hidden="true"
              dir="auto"
              className="line-clamp-4 text-xs font-medium break-words"
            >
              {book.title}
            </span>
          )}
        </div>
      )}
      {/* Spine shading: a crease along the binding, then a soft falloff. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 w-[8%] from-black/30 via-white/15 to-transparent ltr:bg-linear-to-r rtl:bg-linear-to-l"
      />
    </div>
  )
}

export { bookCoverVariants }
