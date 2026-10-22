import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder of the reading room while the reader loads. */
export function ReaderSkeleton({ title }: { title: string }) {
  return (
    <section
      aria-label="اتاق مطالعه"
      aria-busy="true"
      className="flex h-[calc(100svh-4rem-1px)] min-h-[34rem] flex-col bg-muted/60"
    >
      <div className="border-b bg-background/80">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
          <Skeleton className="h-7 w-28" />
          <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold">
            {title}
          </h1>
          <Skeleton className="h-7 w-48 max-md:hidden" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-5 sm:px-10 md:py-7">
        <Skeleton className="aspect-3/5 h-full max-w-full rounded-md md:aspect-4/3" />
      </div>
      <div className="border-t bg-background/80">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-2.5 sm:px-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-1 flex-1" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </section>
  )
}
