import Image from "next/image"
import Link from "next/link"
import { PodcastIcon } from "lucide-react"

import { Highlight } from "@/components/browse/highlight"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { formatNumber } from "@/lib/format"

type PodcastResultCardProps = {
  podcast: {
    id: string
    title: string
    author: string
    artwork: string
    episodeCount: number
  }
  query: string
}

export function PodcastResultCard({ podcast, query }: PodcastResultCardProps) {
  return (
    <Item
      variant="outline"
      className="h-full flex-nowrap bg-card"
      render={<Link href={`/podcasts/${podcast.id}`} />}
    >
      <ItemMedia variant="image" className="size-16 rounded-lg">
        <Image src={podcast.artwork} alt="" width={64} height={64} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="text-base">
          {/* ItemTitle is a flex row; keep the marked text in one run. */}
          <span dir="auto">
            <Highlight text={podcast.title} query={query} />
          </span>
        </ItemTitle>
        <ItemDescription className="line-clamp-1">
          <span dir="auto">
            <Highlight text={podcast.author} query={query} />
          </span>
        </ItemDescription>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <PodcastIcon className="size-3.5" aria-hidden="true" />
          {formatNumber(podcast.episodeCount)} قسمت
        </span>
      </ItemContent>
    </Item>
  )
}
