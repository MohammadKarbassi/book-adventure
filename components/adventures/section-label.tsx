import { cn } from "@/lib/utils"

/** Stripe-like section label: a short rule, then the title. */
export function SectionLabel({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span aria-hidden="true" className="h-px w-8 bg-foreground/50" />
      <h3
        id={id}
        className="flex items-center gap-2 font-heading text-xl leading-none font-bold"
      >
        {children}
      </h3>
    </div>
  )
}
