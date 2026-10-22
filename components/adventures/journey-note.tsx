"use client"

import { AnimatePresence, motion } from "motion/react"
import { SparklesIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** «بر اساس علاقه‌مندی‌های شما»: shown only when the order is personalized. */
export function JourneyNote({
  show,
  className,
}: {
  show: boolean
  className?: string
}) {
  return (
    <AnimatePresence initial={false}>
      {show ? (
        <motion.p
          key="note"
          data-slot="journey-note"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className={cn(
            "flex items-center gap-1.5 overflow-hidden text-xs font-medium text-accent-foreground",
            className
          )}
        >
          <SparklesIcon aria-hidden="true" className="size-3.5 shrink-0" />
          بر اساس علاقه‌مندی‌های شما
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}
