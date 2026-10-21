"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import {
  CrownIcon,
  HeartIcon,
  ShoppingBagIcon,
  SparklesIcon,
} from "lucide-react"
import { toast } from "sonner"

import { LibraryEmpty } from "@/components/library/library-empty"
import {
  LibraryGrid,
  LibraryGridSkeleton,
  type LibraryItem,
} from "@/components/library/library-grid"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BookSummary } from "@/lib/catalog"
import { formatDate, formatNumber } from "@/lib/format"
import {
  useFavorites,
  useHydrated,
  usePurchases,
  useSubscription,
} from "@/lib/store"

const TABS = ["purchased", "favorites", "plus"] as const
type LibraryTab = (typeof TABS)[number]
const DEFAULT_TAB: LibraryTab = "purchased"

const isTab = (value: string): value is LibraryTab =>
  (TABS as readonly string[]).includes(value)

// The selected tab lives in the URL hash (#favorites) so it survives reloads.
function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback)
  return () => window.removeEventListener("hashchange", callback)
}
function readHashTab(): LibraryTab {
  const value = window.location.hash.slice(1)
  return isTab(value) ? value : DEFAULT_TAB
}
function writeHashTab(tab: LibraryTab) {
  window.history.replaceState(window.history.state, "", `#${tab}`)
  window.dispatchEvent(new HashChangeEvent("hashchange"))
}

const shopActions = {
  primary: { href: "/", label: "گشتن در فروشگاه" },
  secondary: { href: "/categories", label: "دیدن دسته‌بندی‌ها" },
}

export function LibraryView({ books }: { books: BookSummary[] }) {
  const hydrated = useHydrated()
  const { favorites, toggleFavorite } = useFavorites()
  const { purchases } = usePurchases()
  const { subscription, isActive } = useSubscription()
  const tab = useSyncExternalStore(
    subscribeHash,
    readHashTab,
    () => DEFAULT_TAB
  )

  const byId = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books]
  )
  const plusItems = useMemo<LibraryItem[]>(
    () => books.filter((book) => book.inPlus).map((book) => ({ book })),
    [books]
  )
  // Stored ids without a catalog entry are skipped, so counts match the grid.
  const purchasedItems = useMemo<LibraryItem[]>(
    () =>
      purchases.flatMap(({ bookId, purchasedAt }) => {
        const book = byId.get(bookId)
        return book ? [{ book, purchasedAt }] : []
      }),
    [purchases, byId]
  )
  const favoriteItems = useMemo<LibraryItem[]>(
    () =>
      favorites.flatMap((id) => {
        const book = byId.get(id)
        return book ? [{ book }] : []
      }),
    [favorites, byId]
  )

  const removeFavorite = useCallback(
    (book: BookSummary) => {
      toggleFavorite(book.id)
      toast(`«${book.title}» از علاقه‌مندی‌ها حذف شد`, {
        action: {
          label: "بازگرداندن",
          // Toggle again only if it is still missing (it may have been re-added elsewhere).
          onClick: () => {
            if (!toggleFavorite(book.id)) toggleFavorite(book.id)
          },
        },
      })
    },
    [toggleFavorite]
  )

  const count = (n: number) =>
    hydrated ? (
      <span className="text-muted-foreground tabular-nums">{`(${formatNumber(n)})`}</span>
    ) : null

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-5xl leading-tight font-bold">
            کتابخانهٔ من
          </h1>
          <p className="max-w-xl text-muted-foreground">
            کتاب‌هایی که خریده‌اید، نشان کرده‌اید یا با اشتراک در دسترس دارید،
            همه در یک قفسه.
          </p>
        </div>
        {!hydrated ? (
          <Skeleton className="h-7 w-44 rounded-full" />
        ) : isActive && subscription ? (
          <Badge
            variant="accent"
            className="h-7 px-3 text-sm"
            render={<Link href="/subscription" />}
          >
            <CrownIcon data-icon="inline-start" />
            {`اشتراک فعال تا ${formatDate(subscription.expiresAt)}`}
          </Badge>
        ) : (
          <Link
            href="/subscription"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <CrownIcon data-icon="inline-start" />
            اشتراک ندارید؟ مشاهدهٔ طرح‌ها
          </Link>
        )}
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (typeof value === "string" && isTab(value)) writeHashTab(value)
        }}
        className="gap-6"
      >
        <TabsList
          variant="line"
          className="h-auto! w-full justify-start gap-1 overflow-x-auto border-b pb-1 sm:gap-2"
        >
          <TabsTrigger
            value="purchased"
            className="flex-none px-2 py-2 sm:px-3"
          >
            <ShoppingBagIcon className="hidden sm:block" />
            خریده‌شده‌ها {count(purchasedItems.length)}
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="flex-none px-2 py-2 sm:px-3"
          >
            <HeartIcon className="hidden sm:block" />
            علاقه‌مندی‌ها {count(favoriteItems.length)}
          </TabsTrigger>
          <TabsTrigger value="plus" className="flex-none px-2 py-2 sm:px-3">
            <SparklesIcon className="hidden sm:block" />
            با اشتراک {isActive ? count(plusItems.length) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchased">
          {!hydrated ? (
            <LibraryGridSkeleton />
          ) : purchasedItems.length > 0 ? (
            <LibraryGrid label="کتاب‌های خریده‌شده" items={purchasedItems} />
          ) : (
            <LibraryEmpty
              icon={ShoppingBagIcon}
              title="هنوز کتابی نخریده‌اید"
              description="کتاب‌هایی که می‌خرید این‌جا می‌مانند تا هر وقت خواستید بخوانید یا گوش کنید."
              {...shopActions}
            />
          )}
        </TabsContent>

        <TabsContent value="favorites">
          {!hydrated ? (
            <LibraryGridSkeleton />
          ) : favoriteItems.length > 0 ? (
            <LibraryGrid
              label="علاقه‌مندی‌ها"
              items={favoriteItems}
              onRemove={removeFavorite}
            />
          ) : (
            <LibraryEmpty
              icon={HeartIcon}
              title="فهرست علاقه‌مندی‌ها خالی است"
              description="با زدن نشان قلب در صفحهٔ هر کتاب، آن را برای بعد این‌جا نگه دارید."
              {...shopActions}
            />
          )}
        </TabsContent>

        <TabsContent value="plus">
          {!hydrated ? (
            <LibraryGridSkeleton />
          ) : isActive ? (
            <LibraryGrid label="کتاب‌های اشتراکی" items={plusItems} />
          ) : (
            <LibraryEmpty
              icon={CrownIcon}
              title="اشتراک فعالی ندارید"
              description={`با اشتراک ماجراجویی، ${formatNumber(plusItems.length)} کتاب اشتراکی بدون خرید برایتان باز می‌شوند.`}
              primary={{
                href: "/subscription",
                label: "مشاهدهٔ طرح‌های اشتراک",
              }}
              secondary={shopActions.secondary}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
