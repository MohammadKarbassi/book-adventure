import Image from "next/image"
import { BookOpenIcon } from "lucide-react"

import type { BookColor } from "@/lib/catalog"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

type BookSpineProps = {
  title: string
  author: string
  image: string
  color: BookColor
  /** Adventure number printed near the head of the spine. */
  number?: number
  priority?: boolean
  className?: string
}

// Cloth weave, then a rounded spine: light catches the upper curve, the
// lower half and both ends (the headbands) fall into shadow.
const CLOTH: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(to right, rgb(0 0 0 / 0.32), rgb(0 0 0 / 0) 3.5%, rgb(0 0 0 / 0) 96.5%, rgb(0 0 0 / 0.32))",
    "linear-gradient(to bottom, rgb(255 255 255 / 0.26), rgb(255 255 255 / 0.06) 22%, rgb(0 0 0 / 0) 50%, rgb(0 0 0 / 0.3))",
    "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.07) 0 1px, transparent 1px 3px)",
    "repeating-linear-gradient(-45deg, rgb(0 0 0 / 0.09) 0 1px, transparent 1px 3px)",
  ].join(", "),
}

// Letterpress: light ink sits in a shadowed groove, dark ink gets a
// highlight on its lower lip.
const EMBOSS_LIGHT_INK =
  "0 -1px 0 rgb(0 0 0 / 0.55), 0 1px 0 rgb(255 255 255 / 0.14)"
const EMBOSS_DARK_INK =
  "0 1px 0 rgb(255 255 255 / 0.5), 0 -1px 0 rgb(0 0 0 / 0.22)"

/**
 * The spine of a cloth-bound book, laid out horizontally (head of the book at
 * the inline-start edge): the cover artwork wraps onto it, mirrored at the
 * fold so it continues seamlessly from the cover, dyed with the book color,
 * with embossed author, title and the site mark. Fills its positioned parent.
 */
export function BookSpine({
  title,
  author,
  image,
  color,
  number,
  priority,
  className,
}: BookSpineProps) {
  const lightInk = color.isDark
  return (
    <span
      aria-hidden="true"
      className={cn(
        "@container-[size] absolute inset-0 block overflow-hidden",
        className
      )}
      style={{ backgroundColor: color.dominant }}
    >
      {/* The cover at full scale, turned so its top meets the spine's head;
          the band nearest the fold shows. */}
      <span
        className="absolute inset-x-0 mx-auto block -scale-x-100 rotate-90"
        style={{ width: "68cqw", height: "100cqw", top: "-16cqw" }}
      >
        <Image
          src={image}
          alt=""
          fill
          sizes="480px"
          loading={priority ? "eager" : "lazy"}
          className="object-cover"
        />
      </span>
      {/* Dye: the print reads through, the type stays legible. */}
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to left, ${color.dominant}, color-mix(in oklab, ${color.dominant} 72%, transparent) 30%, color-mix(in oklab, ${color.dominant} 50%, transparent) 75%, color-mix(in oklab, ${color.dominant} 66%, transparent))`,
        }}
      />
      <span className="absolute inset-0" style={CLOTH} />
      <span className="absolute inset-x-[2%] top-[6%] h-px bg-white/30" />

      <span
        className={cn(
          "relative flex h-full items-center gap-[max(0.5rem,8cqh)] ps-[4.5cqw] pe-[3cqw]",
          lightInk ? "text-white" : "text-black/80"
        )}
        style={{ textShadow: lightInk ? EMBOSS_LIGHT_INK : EMBOSS_DARK_INK }}
      >
        {number !== undefined ? (
          <span className="flex shrink-0 flex-col items-center leading-none">
            <span className="text-[max(0.4rem,11cqh)] font-medium opacity-75">
              ماجراجویی
            </span>
            <span className="font-heading text-[max(0.75rem,36cqh)] font-bold">
              {formatNumber(number)}
            </span>
          </span>
        ) : null}
        {number !== undefined ? (
          <span className="h-[46%] w-px shrink-0 bg-current opacity-30" />
        ) : null}
        <span className="max-w-[24cqw] shrink-0 truncate text-[max(0.55rem,min(20cqh,0.8rem))] leading-tight font-medium opacity-85">
          {author}
        </span>
        <span className="min-w-0 flex-1 truncate text-center font-heading text-[max(0.85rem,min(44cqh,2.1rem))] leading-[1.15] font-bold">
          {title}
        </span>
        {/* The site mark, stamped into a small plate. */}
        <span
          className={cn(
            "flex aspect-square h-[max(1rem,40cqh)] max-h-8 shrink-0 items-center justify-center rounded-s-[2px] rounded-e-[30%] border",
            lightInk
              ? "border-white/45 bg-black/15 shadow-[inset_0_1px_1px_rgb(0_0_0/0.4)]"
              : "border-black/30 bg-white/20 shadow-[inset_0_1px_1px_rgb(0_0_0/0.18)]"
          )}
        >
          <BookOpenIcon className="size-[58%]" strokeWidth={2.25} />
        </span>
      </span>
    </span>
  )
}
