import { CalendarIcon, ClockIcon } from "lucide-react"

import { formatDate, formatDuration } from "@/lib/format"
import type { Episode } from "@/lib/podcasts"
import { cn } from "@/lib/utils"

/** Date and duration of an episode, each only when the feed had it. */
export function EpisodeMeta({
  episode,
  className,
}: {
  episode: Pick<Episode, "publishedAt" | "durationSeconds">
  className?: string
}) {
  if (!episode.publishedAt && episode.durationSeconds == null) return null
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
        className
      )}
    >
      {episode.publishedAt ? (
        <span className="flex items-center gap-1">
          <CalendarIcon aria-hidden="true" className="size-3.5" />
          <time dateTime={episode.publishedAt}>
            {formatDate(episode.publishedAt)}
          </time>
        </span>
      ) : null}
      {episode.durationSeconds != null ? (
        <span className="flex items-center gap-1">
          <ClockIcon aria-hidden="true" className="size-3.5" />
          {formatDuration(episode.durationSeconds)}
        </span>
      ) : null}
    </div>
  )
}
