"use client"

import { Share2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function ShareButton({ className }: { className?: string }) {
  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("لینک کتاب کپی شد")
    } catch {
      toast.error("کپی لینک ممکن نشد", {
        description: "نشانی را از نوار مرورگر کپی کنید.",
      })
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="کپی لینک کتاب"
            onClick={handleClick}
            className={cn("size-10", className)}
          />
        }
      >
        <Share2Icon className="size-4.5" />
      </TooltipTrigger>
      <TooltipContent>کپی لینک کتاب</TooltipContent>
    </Tooltip>
  )
}
