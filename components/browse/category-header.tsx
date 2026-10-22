import Link from "next/link"

import { CategoryIcon } from "@/components/browse/category-icon"
import { CoverFan } from "@/components/browse/cover-fan"
import { Container } from "@/components/site/container"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { BookSummary } from "@/lib/catalog"
import { formatNumber } from "@/lib/format"

type CategoryHeaderProps = {
  slug: string
  title: string
  bookCount: number
  audioCount: number
  /** The category's most read books, fanned at the inline end. */
  covers: BookSummary[]
}

export function CategoryHeader({
  slug,
  title,
  bookCount,
  audioCount,
  covers,
}: CategoryHeaderProps) {
  return (
    <header className="overflow-hidden border-b border-border bg-card/60">
      <Container className="flex items-end justify-between gap-8 pt-6 md:pt-8">
        <div className="flex flex-col gap-6 pb-8 md:pb-10">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>خانه</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/categories" />}>
                  دسته‌بندی‌ها
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-4 md:gap-5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-s-md rounded-e-2xl bg-accent text-accent-foreground md:size-18">
              <CategoryIcon slug={slug} className="size-7 md:size-9" />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-4xl leading-tight font-bold text-balance md:text-5xl">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatNumber(bookCount)} کتاب
                {audioCount > 0
                  ? ` · ${formatNumber(audioCount)} کتاب صوتی`
                  : null}
              </p>
            </div>
          </div>
        </div>
        {covers.length > 0 ? (
          <CoverFan
            books={covers}
            priority
            className="hidden w-64 shrink-0 translate-y-2 md:flex lg:w-72"
          />
        ) : null}
      </Container>
    </header>
  )
}
