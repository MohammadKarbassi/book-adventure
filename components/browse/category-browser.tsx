"use client"

import {
  ArrowDownUpIcon,
  CrownIcon,
  FilterXIcon,
  SearchXIcon,
} from "lucide-react"

import { TypeToggleGroup } from "@/components/browse/type-toggle-group"
import { useUrlState } from "@/components/browse/use-url-state"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Spinner } from "@/components/ui/spinner"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  defaultBrowseState,
  getPageNumbers,
  serializeBrowseParams,
  sortOptions,
  type BrowseState,
  type SortKey,
} from "@/lib/browse"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export type SubcategoryChip = {
  slug: string
  title: string
  count: number
}

type CategoryBrowserProps = {
  state: BrowseState
  subcategories: SubcategoryChip[]
  /** Books matching the current filters, across all pages. */
  total: number
  /** Books in the whole category. */
  categoryTotal: number
  pageCount: number
  /** The server-rendered grid for the current page. */
  children: React.ReactNode
}

const ALL = "all"

export function CategoryBrowser({
  state: serverState,
  subcategories,
  total,
  categoryTotal,
  pageCount,
  children,
}: CategoryBrowserProps) {
  const { state, isPending, navigate } = useUrlState(
    serverState,
    serializeBrowseParams
  )

  // Any filter change starts again from the first page.
  const update = (patch: Partial<BrowseState>) =>
    navigate({ ...state, page: 1, ...patch })

  const isFiltered = state.type !== "all" || state.plus || state.sub !== null
  const sortLabel =
    sortOptions.find((option) => option.value === state.sort)?.label ?? ""

  return (
    <div className="flex flex-col gap-6">
      {subcategories.length > 0 ? (
        <ToggleGroup
          aria-label="زیردسته"
          value={[state.sub ?? ALL]}
          onValueChange={(next) => {
            const [selected] = next
            if (selected) update({ sub: selected === ALL ? null : selected })
          }}
          className="flex-wrap"
        >
          <ToggleGroupItem value={ALL} className={chipClassName}>
            همه
            <ChipCount count={categoryTotal} />
          </ToggleGroupItem>
          {subcategories.map((sub) => (
            <ToggleGroupItem
              key={sub.slug}
              value={sub.slug}
              className={chipClassName}
            >
              {sub.title}
              <ChipCount count={sub.count} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-y border-border py-3">
        <TypeToggleGroup
          value={state.type}
          onValueChange={(type) => update({ type })}
        />
        <Toggle
          variant="outline"
          pressed={state.plus}
          onPressedChange={(plus) => update({ plus })}
          className="bg-card px-3 aria-pressed:bg-accent aria-pressed:text-accent-foreground"
        >
          <CrownIcon data-icon="inline-start" />
          فقط اشتراکی
        </Toggle>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className="bg-card" />}
          >
            <ArrowDownUpIcon data-icon="inline-start" />
            <span className="text-muted-foreground">مرتب‌سازی:</span>
            {sortLabel}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>مرتب‌سازی بر اساس</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={state.sort}
                onValueChange={(sort: SortKey) => update({ sort })}
              >
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <p
          className="ms-auto flex items-center gap-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          {isPending ? <Spinner aria-label="در حال به‌روزرسانی" /> : null}
          {isFiltered
            ? `${formatNumber(total)} کتاب از ${formatNumber(categoryTotal)}`
            : `${formatNumber(total)} کتاب`}
        </p>
      </div>

      <div
        aria-busy={isPending}
        className={cn(
          "flex flex-col gap-10 transition-opacity duration-200 motion-reduce:transition-none",
          isPending && "opacity-60"
        )}
      >
        {total === 0 ? (
          <Empty className="border border-border bg-card py-16">
            <EmptyHeader>
              <EmptyMedia
                variant="icon"
                className="size-14 rounded-full bg-accent text-accent-foreground"
              >
                <SearchXIcon className="size-7" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl font-bold">
                کتابی با این فیلترها پیدا نشد
              </EmptyTitle>
              <EmptyDescription>
                فیلترها را کمتر کنید یا همهٔ کتاب‌های این دسته را ببینید.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() =>
                  navigate({ ...defaultBrowseState, sort: state.sort })
                }
              >
                <FilterXIcon data-icon="inline-start" />
                پاک کردن فیلترها
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          children
        )}

        {pageCount > 1 ? (
          <Pagination aria-label="صفحه‌بندی">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text="قبلی"
                  aria-label="صفحهٔ قبلی"
                  {...pageLinkProps(state.page - 1)}
                />
              </PaginationItem>
              {getPageNumbers(state.page, pageCount).map((page, index) => (
                <PaginationItem key={page === "ellipsis" ? `e${index}` : page}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      isActive={page === state.page}
                      aria-label={`صفحهٔ ${formatNumber(page)}`}
                      {...pageLinkProps(page)}
                    >
                      {formatNumber(page)}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  text="بعدی"
                  aria-label="صفحهٔ بعدی"
                  {...pageLinkProps(state.page + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </div>
  )

  /** A real link (works without JS) that navigates inside the transition. */
  function pageLinkProps(page: number) {
    if (page < 1 || page > pageCount) {
      return {
        "aria-disabled": true,
        className: "pointer-events-none opacity-50",
      }
    }
    const next = { ...state, page }
    return {
      href: serializeBrowseParams(next) || "?",
      onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return
        event.preventDefault()
        navigate(next, { history: "push", scroll: true })
      },
    }
  }
}

const chipClassName =
  "h-8 rounded-full border border-border bg-card px-3.5 aria-pressed:border-transparent aria-pressed:bg-foreground aria-pressed:text-background aria-pressed:hover:bg-foreground/90 aria-pressed:hover:text-background"

function ChipCount({ count }: { count: number }) {
  return (
    <span className="text-xs tabular-nums opacity-60">
      {formatNumber(count)}
    </span>
  )
}
