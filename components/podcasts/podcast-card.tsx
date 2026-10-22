import Image from "next/image"
import Link from "next/link"
import { ListMusicIcon } from "lucide-react"

import { genreLabel } from "@/components/podcasts/podcast-data"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatNumber } from "@/lib/format"
import type { Podcast } from "@/lib/podcasts"

export function PodcastCard({
  podcast,
  priority = false,
}: {
  podcast: Pick<Podcast, "id" | "title" | "author" | "artwork" | "genre"> & {
    episodeCount: number
  }
  priority?: boolean
}) {
  return (
    <Link
      href={`/podcasts/${podcast.id}`}
      className="group/podcast block w-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full gap-3 pt-0 transition-[box-shadow,translate] duration-200 group-hover/podcast:-translate-y-1 group-hover/podcast:shadow-lg motion-reduce:transition-none motion-reduce:group-hover/podcast:translate-y-0">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={podcast.artwork}
            alt=""
            fill
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
            loading={priority ? "eager" : "lazy"}
            className="object-cover transition-transform duration-300 group-hover/podcast:scale-105 motion-reduce:transition-none motion-reduce:group-hover/podcast:scale-100"
          />
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1 text-xl font-bold">
            {podcast.title}
          </CardTitle>
          <CardDescription className="line-clamp-1 text-xs">
            {podcast.author}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex items-center justify-between gap-2">
          <Badge variant="accent">{genreLabel(podcast.genre)}</Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ListMusicIcon aria-hidden="true" className="size-3.5" />
            {formatNumber(podcast.episodeCount)} قسمت
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
