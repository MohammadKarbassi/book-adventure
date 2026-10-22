"use client"

import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { ItemDescription } from "@/components/ui/item"
import { cn } from "@/lib/utils"

/** Descriptions longer than this get a «بیشتر/کمتر» toggle. */
const CLAMP_CHARS = 140

export function EpisodeDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const id = useId()
  if (!text) return null
  const long = text.length > CLAMP_CHARS

  return (
    <div className="flex flex-col items-start gap-1">
      <ItemDescription
        id={id}
        className={cn("text-sm/relaxed", expanded && "line-clamp-none")}
      >
        {text}
      </ItemDescription>
      {long ? (
        <Button
          variant="link"
          size="xs"
          className="h-auto px-0 text-accent-foreground"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "کمتر" : "بیشتر"}
        </Button>
      ) : null}
    </div>
  )
}
