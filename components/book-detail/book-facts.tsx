import { cn } from "@/lib/utils"

export type BookFact = {
  label: string
  value: React.ReactNode
}

type BookFactsProps = {
  facts: BookFact[]
  /** Two columns from `sm` up (header), or one row per fact (specs tab). */
  columns?: 1 | 2
  className?: string
}

/** A quiet definition list: label at the start, value at the end. */
export function BookFacts({ facts, columns = 2, className }: BookFactsProps) {
  return (
    <dl
      className={cn(
        "grid gap-x-10 text-sm",
        columns === 2 && "sm:grid-cols-2",
        className
      )}
    >
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex items-baseline justify-between gap-4 border-b border-border/70 py-2.5"
        >
          <dt className="shrink-0 text-muted-foreground">{fact.label}</dt>
          <dd className="min-w-0 text-end font-medium text-pretty">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
