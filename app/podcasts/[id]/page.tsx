import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLinkIcon, ListMusicIcon, RssIcon } from "lucide-react"

import { SectionHeader } from "@/components/book/section-header"
import { PlayButton } from "@/components/player/play-button"
import { EpisodeDescription } from "@/components/podcasts/episode-description"
import { EpisodeMeta } from "@/components/podcasts/episode-meta"
import { episodeTrack, genreLabel } from "@/components/podcasts/podcast-data"
import { Container } from "@/components/site/container"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item"
import { formatNumber } from "@/lib/format"
import { getPodcast, getPodcasts } from "@/lib/podcasts"

type PodcastPageProps = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return getPodcasts().map((podcast) => ({ id: podcast.id }))
}

export async function generateMetadata({
  params,
}: PodcastPageProps): Promise<Metadata> {
  const { id } = await params
  const podcast = getPodcast(id)
  if (!podcast) return {}
  return {
    title: podcast.title,
    description: podcast.description,
    openGraph: { images: [podcast.artwork] },
  }
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const { id } = await params
  const podcast = getPodcast(id)
  if (!podcast) notFound()
  const [newest] = podcast.episodes

  return (
    <>
      <section className="relative isolate overflow-hidden border-b">
        {/* The artwork, blurred, tints the header in the show's own colors. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src={podcast.artwork}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            className="scale-125 object-cover opacity-30 blur-3xl dark:opacity-20"
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/40 to-background" />
        </div>
        <Container className="flex flex-col gap-8 py-10 md:py-14">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>خانه</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/podcasts" />}>
                  پادکست‌ها
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{podcast.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-col gap-8 md:flex-row md:items-end">
            <div className="relative aspect-square w-48 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-2xl ring-1 ring-foreground/10 sm:w-56 md:w-64">
              <Image
                src={podcast.artwork}
                alt={`نگارهٔ پادکست ${podcast.title}`}
                fill
                sizes="256px"
                loading="eager"
                fetchPriority="high"
                className="object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col items-start gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">{genreLabel(podcast.genre)}</Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ListMusicIcon aria-hidden="true" className="size-4" />
                  {formatNumber(podcast.episodes.length)} قسمت
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="font-heading text-5xl leading-tight font-bold text-balance md:text-6xl">
                  {podcast.title}
                </h1>
                <p className="text-muted-foreground">{podcast.author}</p>
              </div>
              {podcast.description ? (
                <p className="max-w-2xl text-base/relaxed text-pretty">
                  {podcast.description}
                </p>
              ) : null}
              {newest ? (
                <PlayButton
                  track={episodeTrack(podcast, newest)}
                  label="پخش جدیدترین قسمت"
                  size="lg"
                  className="h-11 rounded-full px-5 text-base"
                />
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <Container className="flex flex-col gap-6 py-12">
        <section aria-labelledby="episodes" className="flex flex-col gap-6">
          <SectionHeader
            id="episodes"
            title="قسمت‌ها"
            description="تازه‌ترین قسمت‌ها در بالای فهرست آمده‌اند"
          />
          <ItemGroup className="gap-3">
            {podcast.episodes.map((episode, index) => {
              const titleId = `episode-${episode.id}`
              return (
                <Item
                  key={episode.id}
                  role="listitem"
                  variant="outline"
                  className="items-start gap-4 bg-card px-4 py-4 sm:px-5"
                >
                  <span
                    aria-hidden="true"
                    className="hidden w-8 shrink-0 pt-0.5 font-heading text-2xl leading-none text-muted-foreground sm:block"
                  >
                    {formatNumber(index + 1)}
                  </span>
                  <ItemContent className="min-w-0 gap-2">
                    <ItemTitle className="w-auto">
                      <h3 id={titleId} className="line-clamp-2 text-base">
                        {episode.title}
                      </h3>
                    </ItemTitle>
                    <EpisodeMeta episode={episode} />
                    <EpisodeDescription text={episode.description} />
                  </ItemContent>
                  <ItemActions className="self-center">
                    <PlayButton
                      track={episodeTrack(podcast, episode)}
                      label="پخش"
                      variant="outline"
                      aria-describedby={titleId}
                    />
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        </section>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <RssIcon aria-hidden="true" className="size-4" />
          <a
            href={podcast.feedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-sm underline-offset-4 outline-none hover:text-accent-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            منبع: فید عمومی RSS این پادکست
            <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
            <span className="sr-only">(در زبانهٔ تازه)</span>
          </a>
        </p>
      </Container>
    </>
  )
}
