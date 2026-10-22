"use client"

import Link from "next/link"
import { motion } from "motion/react"
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HeadphonesIcon,
  PodcastIcon,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

type RailItem = { id: number; name: string }

type AdventureRailProps = {
  items: RailItem[]
  activeIndex: number
  reduced: boolean
  onSelect: (index: number) => void
}

const railLinks = [
  { href: "/audiobooks", label: "کتاب‌های صوتی", icon: HeadphonesIcon },
  { href: "/podcasts", label: "پادکست‌ها", icon: PodcastIcon },
]

const ghostIcon = cn(
  buttonVariants({ variant: "ghost", size: "icon" }),
  "text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
)

export const railLabel = (index: number, name: string) =>
  `ماجراجویی ${formatNumber(index + 1)} · ${name}`

/** The site mark, home link of the immersive journey. */
export function AdventureMark({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href="/"
            aria-label="ماجراجویی با کتاب — صفحهٔ اصلی"
            className={cn(
              "flex size-9 items-center justify-center rounded-s-sm rounded-e-lg border border-current/40 text-foreground transition-colors outline-none hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/60",
              className
            )}
          />
        }
      >
        <BookOpenIcon className="size-4.5" />
      </TooltipTrigger>
      <TooltipContent side="inline-end">ماجراجویی با کتاب</TooltipContent>
    </Tooltip>
  )
}

/** «؟»: how the journey works. */
export function AdventureHelp({ className }: { className?: string }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="راهنمای مسیر ماجراجویی"
            className={cn(ghostIcon, "font-heading text-xl", className)}
          />
        }
      >
        ؟
      </PopoverTrigger>
      <PopoverContent side="inline-end" align="end" className="w-64">
        <PopoverTitle>راهنمای مسیر</PopoverTitle>
        <PopoverDescription>
          کتاب را بکشید تا بچرخد · با اسکرول به ماجرای بعد بروید
        </PopoverDescription>
      </PopoverContent>
    </Popover>
  )
}

/**
 * The continuous side rail: back to the shelf, one tick per adventure, then
 * audiobooks and podcasts. Inherits the current room's ink.
 */
export function AdventureRail({
  items,
  activeIndex,
  reduced,
  onSelect,
}: AdventureRailProps) {
  return (
    <nav
      aria-label="مسیر ماجراجویی"
      className="flex flex-col items-center gap-4 text-foreground"
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Link href="/" aria-label="بازگشت به قفسه" className={ghostIcon} />
          }
        >
          <ArrowRightIcon />
        </TooltipTrigger>
        <TooltipContent side="inline-end">بازگشت به قفسه</TooltipContent>
      </Tooltip>

      <ol className="flex flex-col items-center">
        {items.map((item, index) => {
          const current = index === activeIndex
          const label = railLabel(index, item.name)
          return (
            <motion.li
              key={item.id}
              layout={reduced ? false : "position"}
              transition={{ type: "spring", stiffness: 200, damping: 28 }}
            >
              <Tooltip>
                <TooltipTrigger
                  aria-label={label}
                  aria-current={current ? "step" : undefined}
                  onClick={() => onSelect(index)}
                  className="group/tick flex h-3.5 w-10 items-center justify-start rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
                >
                  <span
                    className={cn(
                      "h-0.5 rounded-full transition-all duration-300 motion-reduce:transition-none",
                      current
                        ? "w-6 bg-foreground"
                        : "w-3.5 bg-foreground/35 group-hover/tick:w-5 group-hover/tick:bg-foreground/70"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="inline-end">{label}</TooltipContent>
              </Tooltip>
            </motion.li>
          )
        })}
      </ol>

      <div className="flex flex-col items-center gap-1 border-t border-foreground/20 pt-3">
        {railLinks.map(({ href, label, icon: Icon }) => (
          <Tooltip key={href}>
            <TooltipTrigger
              render={
                <Link href={href} aria-label={label} className={ghostIcon} />
              }
            >
              <Icon />
            </TooltipTrigger>
            <TooltipContent side="inline-end">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </nav>
  )
}

/** Small screens: a compact sticky bar instead of the rail. */
export function AdventureBar({
  items,
  activeIndex,
  onSelect,
}: Omit<AdventureRailProps, "reduced">) {
  const current = items[activeIndex]
  return (
    <nav
      aria-label="مسیر ماجراجویی (فشرده)"
      className="border-b border-foreground/15 bg-background/80 text-foreground backdrop-blur-md transition-colors duration-500"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-3 sm:px-5">
        <AdventureMark className="me-1 size-8" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="ماجراجویی قبلی"
          disabled={activeIndex === 0}
          onClick={() => onSelect(activeIndex - 1)}
          className={ghostIcon}
        >
          <ChevronUpIcon />
        </Button>
        <p className="flex min-w-0 flex-1 flex-col items-center text-center leading-tight">
          <span className="text-xs font-medium">
            {`ماجراجویی ${formatNumber(activeIndex + 1)} از ${formatNumber(items.length)}`}
          </span>
          {current ? (
            <span className="w-full truncate text-xs text-muted-foreground">
              {current.name}
            </span>
          ) : null}
        </p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="ماجراجویی بعدی در مسیر"
          disabled={activeIndex >= items.length - 1}
          onClick={() => onSelect(activeIndex + 1)}
          className={ghostIcon}
        >
          <ChevronDownIcon />
        </Button>
        <AdventureHelp />
      </div>
    </nav>
  )
}
