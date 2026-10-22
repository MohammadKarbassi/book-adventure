import { BookGridSkeleton } from "@/components/browse/book-grid-skeleton"
import { Container } from "@/components/site/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status" aria-label="در حال بارگذاری دسته">
      <div className="border-b border-border bg-card/60">
        <Container className="flex flex-col gap-6 pt-6 pb-8 md:pt-8 md:pb-10">
          <Skeleton className="h-4 w-56" />
          <div className="flex items-center gap-4 md:gap-5">
            <Skeleton className="size-14 rounded-s-md rounded-e-2xl md:size-18" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </Container>
      </div>
      <Container className="flex flex-col gap-6 py-8">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-14 w-full" />
        <BookGridSkeleton />
      </Container>
    </div>
  )
}
