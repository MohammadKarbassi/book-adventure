"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const label = "تغییر حالت روشن و تیره"

function useToggleTheme() {
  const { resolvedTheme, setTheme } = useTheme()
  return () => setTheme(resolvedTheme === "dark" ? "light" : "dark")
}

// Both icons are rendered and swapped with the `dark:` variant, so the
// server and the first client render match before the theme is known.
function ThemeIcon() {
  return (
    <>
      <SunIcon className="dark:hidden" />
      <MoonIcon className="hidden dark:block" />
    </>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const toggleTheme = useToggleTheme()

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            className={className}
            onClick={toggleTheme}
          />
        }
      >
        <ThemeIcon />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        حالت روشن و تیره <Kbd>D</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

/** Full-width variant for the mobile menu. */
export function ThemeToggleButton({ className }: { className?: string }) {
  const toggleTheme = useToggleTheme()

  return (
    <Button
      variant="outline"
      className={cn("w-full justify-start", className)}
      onClick={toggleTheme}
    >
      <ThemeIcon />
      {label}
    </Button>
  )
}
