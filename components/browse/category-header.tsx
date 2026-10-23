import Link from "next/link"

import { CoverFan } from "@/components/browse/cover-fan"
import { PageHero } from "@/components/site/page-hero"
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
  title: string
  bookCount: number
  audioCount: number
  /** The category's most read books, fanned at the inline end. */
  covers: BookSummary[]
}

export function CategoryHeader({
  title,
  bookCount,
  audioCount,
  covers,
}: CategoryHeaderProps) {
  return (
    <PageHero
      title={title}
      breadcrumb={
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
      }
      meta={
        <>
          {formatNumber(bookCount)} کتاب
          {audioCount > 0 ? ` · ${formatNumber(audioCount)} کتاب صوتی` : null}
        </>
      }
      aside={
        covers.length > 0 ? (
          <CoverFan
            books={covers}
            priority
            className="group/fan w-48 md:w-64 lg:w-72"
          />
        ) : null
      }
    />
  )
}
