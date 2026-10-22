import { Container } from "@/components/site/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <Container
      role="status"
      aria-label="در حال بارگذاری کتاب"
      className="pt-6 pb-16"
    >
      <Skeleton className="h-4 w-64" />
      <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[20rem_minmax(0,1fr)] xl:gap-20">
        <div className="flex justify-center lg:pt-2">
          <Skeleton className="aspect-2/3 w-56 rounded-s-[3px] rounded-e-lg sm:w-64 lg:w-full" />
        </div>
        <div className="flex flex-col items-center gap-4 lg:items-start">
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-14 w-full max-w-lg" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-6 h-48 w-full rounded-xl" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      </div>
    </Container>
  )
}
