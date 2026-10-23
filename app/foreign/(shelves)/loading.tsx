import { Container } from "@/components/site/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status" aria-label="در حال بارگذاری کتاب‌های خارجی">
      <div className="border-b border-border">
        <Container className="flex flex-col gap-5 pt-10 pb-8 md:pt-16 md:pb-10">
          <Skeleton className="h-14 w-72" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-5 w-full max-w-xl" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </Container>
      </div>
      <Container className="flex flex-col gap-16 py-12">
        {Array.from({ length: 2 }, (_, shelf) => (
          <div key={shelf} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-2 gap-4 py-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-3 max-xl:nth-[n+5]:hidden max-lg:nth-[n+4]:hidden max-md:nth-[n+3]:hidden"
                >
                  <Skeleton className="aspect-2/3 w-full rounded-s-[3px] rounded-e-md" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </Container>
    </div>
  )
}
