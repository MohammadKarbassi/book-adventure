"use client"

import { HeartIcon } from "lucide-react"
import { useAnimate, useReducedMotion } from "motion/react"
import { toast } from "sonner"

import { toastSaveError } from "@/components/site/save-error"
import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EASE_OUT } from "@/lib/motion"
import { useFavorites } from "@/lib/store"
import { cn } from "@/lib/utils"

type FavoriteButtonProps = {
  bookId: number
  title: string
  /** Runs after a toggle with the new state (true = added). */
  onToggle?: (added: boolean) => void
  className?: string
}

export function FavoriteButton({
  bookId,
  title,
  onToggle,
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(bookId)
  const [heartRef, animate] = useAnimate<SVGSVGElement>()
  const reduceMotion = useReducedMotion()
  const label = active ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"

  function handleChange() {
    const added = toggleFavorite(bookId)
    if (added === null) {
      toastSaveError("علاقه‌مندی‌ها به‌روز نشد")
      return
    }
    onToggle?.(added)
    if (added) {
      // Only a real add pops the heart; removing just changes its color.
      if (!reduceMotion) {
        animate(
          heartRef.current,
          { scale: [1, 1.3, 1] },
          { duration: 0.28, ease: EASE_OUT }
        )
      }
      toast.success("به علاقه‌مندی‌ها اضافه شد", { description: title })
    } else {
      toast("از علاقه‌مندی‌ها حذف شد", { description: title })
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            variant="outline"
            size="lg"
            pressed={active}
            onPressedChange={handleChange}
            aria-label={label}
            className={cn("size-10", className)}
          />
        }
      >
        <HeartIcon
          ref={heartRef}
          className={cn(
            "size-4.5 transition-colors",
            active && "fill-destructive text-destructive"
          )}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
