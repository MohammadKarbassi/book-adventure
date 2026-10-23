import { AccentText } from "@/components/site/accent-text"
import { Container } from "@/components/site/container"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  /** The page's h1. */
  title: string
  /** A whole word (or words) of `title` shown in the accent color. */
  accent?: string
  description?: React.ReactNode
  /** A small muted line under the description, e.g. counts. */
  meta?: React.ReactNode
  /** Navigation above the title, e.g. a breadcrumb. */
  breadcrumb?: React.ReactNode
  /** Decorative art at the inline end: a cover fan or an illustration. */
  aside?: React.ReactNode
  /** Buttons under the text. */
  actions?: React.ReactNode
  /** Full-width content under the hero text, e.g. filters or a status card. */
  children?: React.ReactNode
  className?: string
}

/**
 * The shop pages' shared header: a Markazi display title with one accent
 * word, quiet copy, and a hairline rule underneath, like paper.
 */
export function PageHero({
  title,
  accent,
  description,
  meta,
  breadcrumb,
  aside,
  actions,
  children,
  className,
}: PageHeroProps) {
  return (
    <header
      data-slot="page-hero"
      className={cn("overflow-x-clip border-b border-border", className)}
    >
      <Container className="flex flex-col gap-8 pt-10 pb-8 md:pt-16 md:pb-10">
        <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
          <div className="flex min-w-0 animate-in flex-col gap-5 duration-700 fill-mode-both fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
            {breadcrumb}
            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-5xl leading-tight font-bold text-balance md:text-6xl">
                <AccentText text={title} accent={accent} />
              </h1>
              {description ? (
                <p className="max-w-prose text-base/relaxed text-pretty text-muted-foreground md:text-lg/relaxed">
                  {description}
                </p>
              ) : null}
              {meta ? (
                <p className="text-sm text-muted-foreground">{meta}</p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-3">{actions}</div>
            ) : null}
          </div>
          {aside ? (
            <div className="flex justify-center pb-4 md:justify-end md:pb-2">
              {aside}
            </div>
          ) : null}
        </div>
        {children}
      </Container>
    </header>
  )
}
