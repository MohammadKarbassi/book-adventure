import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { RssIcon } from "lucide-react"

import { SectionHeader } from "@/components/book/section-header"
import { PlayButton } from "@/components/player/play-button"
import { EpisodeMeta } from "@/components/podcasts/episode-meta"
import { PodcastCard } from "@/components/podcasts/podcast-card"
import {
  episodeTrack,
  latestEpisodes,
} from "@/components/podcasts/podcast-data"
import { Container } from "@/components/site/container"
import { PageHero } from "@/components/site/page-hero"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { formatNumber } from "@/lib/format"
import { getPodcasts } from "@/lib/podcasts"

export const metadata: Metadata = {
  title: "پادکست‌ها",
  description: "پادکست‌های فارسی منتخب دربارهٔ کتاب، داستان و تاریخ",
}

const LATEST_COUNT = 8
/** Podcast artworks in the first screen; the rest load lazily. */
const EAGER_ARTWORKS = 2

export default function PodcastsPage() {
  const podcasts = getPodcasts()
  const latest = latestEpisodes(podcasts, LATEST_COUNT)

  return (
    <>
      <PageHero
        title="پادکست‌ها"
        description={`${formatNumber(podcasts.length)} پادکست فارسی منتخب دربارهٔ کتاب، داستان و تاریخ`}
        meta={
          <span className="flex items-center gap-1.5">
            <RssIcon aria-hidden="true" className="size-3.5" />
            از فیدهای عمومی RSS
          </span>
        }
      />

      <Container className="flex flex-col gap-16 py-12">
        <section aria-labelledby="all-podcasts" className="flex flex-col gap-6">
          <SectionHeader
            id="all-podcasts"
            title="همهٔ پادکست‌ها"
            description="روی هر پادکست بزنید تا قسمت‌هایش را ببینید و گوش بدهید"
          />
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
            {podcasts.map((podcast, index) => (
              <li key={podcast.id} className="flex">
                <PodcastCard
                  // Only the first artworks sit above the fold; the rest load lazily.
                  priority={index < EAGER_ARTWORKS}
                  podcast={{
                    id: podcast.id,
                    title: podcast.title,
                    author: podcast.author,
                    artwork: podcast.artwork,
                    genre: podcast.genre,
                    episodeCount: podcast.episodes.length,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="latest-episodes"
          className="flex flex-col gap-6"
        >
          <SectionHeader
            id="latest-episodes"
            title="تازه‌ترین قسمت‌ها"
            description="آخرین قسمت‌هایی که این پادکست‌ها منتشر کرده‌اند"
          />
          <ItemGroup className="grid gap-3 lg:grid-cols-2">
            {latest.map(({ podcast, episode }) => {
              const titleId = `latest-${podcast.id}-${episode.id}`
              return (
                <Item key={titleId} role="listitem" variant="outline">
                  <ItemMedia variant="image" className="size-16 rounded-md">
                    <Image
                      src={podcast.artwork}
                      alt=""
                      width={64}
                      height={64}
                    />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <Link
                      href={`/podcasts/${podcast.id}`}
                      className="w-fit rounded-sm text-xs font-medium text-accent-foreground outline-none hover:underline hover:underline-offset-4 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {podcast.title}
                    </Link>
                    <ItemTitle
                      id={titleId}
                      className="line-clamp-2 w-auto sm:line-clamp-1"
                    >
                      {episode.title}
                    </ItemTitle>
                    <EpisodeMeta episode={episode} />
                  </ItemContent>
                  <ItemActions>
                    <PlayButton
                      track={episodeTrack(podcast, episode)}
                      label="پخش"
                      variant="outline"
                      size="sm"
                      aria-describedby={titleId}
                    />
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        </section>
      </Container>
    </>
  )
}
