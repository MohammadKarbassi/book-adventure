import { BookGridSkeleton } from "@/components/browse/book-grid-skeleton"
import { Container } from "@/components/site/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status" aria-label="در حال جستجو">
      <div className="border-b border-border bg-card/60">
        <Container className="max-w-3xl py-8 md:py-10">
          <Skeleton className="h-12 w-full rounded-xl" />
        </Container>
      </div>
      <Container className="flex flex-col gap-6 py-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-80 max-w-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-72" />
        <BookGridSkeleton />
      </Container>
    </div>
  )
}
