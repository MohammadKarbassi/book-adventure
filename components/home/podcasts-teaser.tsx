import Image from "next/image"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { SectionHeader } from "@/components/book/section-header"
import { Button } from "@/components/ui/button"

export type PodcastTeaserItem = {
  id: string
  title: string
  author: string
  artwork: string
}

export function PodcastsTeaser({
  podcasts,
}: {
  podcasts: PodcastTeaserItem[]
}) {
  return (
    <section aria-labelledby="podcasts-heading" className="flex flex-col gap-5">
      <SectionHeader
        id="podcasts-heading"
        title="پادکست‌ها"
        description="گفت‌وگو، روایت و داستان؛ برای وقتی که چشم‌هایتان استراحت می‌خواهند"
        action={
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/podcasts" />}
          >
            همهٔ پادکست‌ها
            <ArrowLeftIcon data-icon="inline-end" />
          </Button>
        }
      />
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
        {podcasts.map((podcast) => (
          <li key={podcast.id} className="max-sm:last:hidden">
            <Link
              href={`/podcasts/${podcast.id}`}
              className="group/podcast flex flex-col gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="relative aspect-square overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-foreground/10 transition-shadow duration-300 group-hover/podcast:shadow-xl">
                <Image
                  src={podcast.artwork}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover/podcast:scale-105 motion-reduce:transition-none motion-reduce:group-hover/podcast:scale-100"
                />
              </span>
              <span className="flex flex-col gap-0.5 px-0.5">
                <span className="line-clamp-1 text-sm font-medium group-hover/podcast:text-accent-foreground">
                  {podcast.title}
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {podcast.author}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
