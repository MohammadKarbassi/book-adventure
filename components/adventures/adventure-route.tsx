"use client"

import { motion } from "motion/react"
import {
  FlagIcon,
  MapPinIcon,
  MountainIcon,
  type LucideIcon,
} from "lucide-react"

import type { AdventureStop } from "@/components/adventures/adventure-types"
import { SectionLabel } from "@/components/adventures/section-label"

const STOP_ICONS: LucideIcon[] = [FlagIcon, MountainIcon, MapPinIcon]

/**
 * «مسیر ماجراجویی»: three stops on a dotted trail that draws itself when it
 * scrolls into view. MotionConfig (reducedMotion="user") upstream turns the
 * drawing into a plain fade.
 */
export function AdventureRoute({
  stops,
  headingId,
}: {
  stops: AdventureStop[]
  headingId: string
}) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <SectionLabel id={headingId}>مسیر ماجراجویی</SectionLabel>
      <motion.ol
        className="relative flex flex-col gap-7"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, amount: 0.35 }}
      >
        {/* The trail between the first and the last stop. */}
        <motion.span
          aria-hidden="true"
          className="absolute start-[1.1875rem] top-5 bottom-5 w-0 origin-top border-s-2 border-dotted border-foreground/35"
          variants={{
            hidden: { scaleY: 0 },
            shown: {
              scaleY: 1,
              transition: { duration: 1.4, ease: "easeInOut" },
            },
          }}
        />
        {stops.map((stop, index) => {
          const Icon = STOP_ICONS[index] ?? MapPinIcon
          return (
            <motion.li
              key={index}
              className="relative flex gap-4"
              variants={{
                hidden: { opacity: 0, y: 10 },
                shown: {
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.25 + index * 0.45, duration: 0.5 },
                },
              }}
            >
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/25 bg-foreground/[0.05]">
                <Icon aria-hidden="true" className="size-4.5" />
              </span>
              <div className="flex min-w-0 flex-col gap-1 pt-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {stop.label}
                </span>
                <span className="font-heading text-lg leading-snug font-bold">
                  {stop.title}
                </span>
                <p className="max-w-prose text-sm leading-7 text-pretty text-foreground/85">
                  {stop.text}
                </p>
              </div>
            </motion.li>
          )
        })}
      </motion.ol>
    </section>
  )
}
