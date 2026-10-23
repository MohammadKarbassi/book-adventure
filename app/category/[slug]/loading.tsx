import { BookGridSkeleton } from "@/components/browse/book-grid-skeleton"
import { Container } from "@/components/site/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status" aria-label="در حال بارگذاری دسته">
      <div className="border-b border-border">
        <Container className="flex flex-col gap-5 pt-10 pb-8 md:pt-16 md:pb-10">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-14 w-64" />
          <Skeleton className="h-4 w-32" />
        </Container>
      </div>
      <Container className="flex flex-col gap-6 py-10">
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
