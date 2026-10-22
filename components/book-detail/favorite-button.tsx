"use client"

import { HeartIcon } from "lucide-react"
import { toast } from "sonner"

import { Toggle } from "@/components/ui/toggle"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

  function handleChange() {
    const added = toggleFavorite(bookId)
    onToggle?.(added)
    if (added) {
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
            aria-label="افزودن به علاقه‌مندی‌ها"
            className={cn("size-10", className)}
          />
        }
      >
        <HeartIcon
          className={cn(
            "size-4.5 transition-colors",
            active && "fill-destructive text-destructive"
          )}
        />
      </TooltipTrigger>
      <TooltipContent>
        {active ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      </TooltipContent>
    </Tooltip>
  )
}
