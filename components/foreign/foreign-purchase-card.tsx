"use client"

import { useRef, useState } from "react"
import {
  ExternalLinkIcon,
  GlobeIcon,
  LibraryBigIcon,
  ShoppingBagIcon,
} from "lucide-react"

import { PriceTag } from "@/components/book/price-tag"
import { FavoriteButton } from "@/components/book-detail/favorite-button"
import {
  PurchaseDialog,
  type PurchaseBook,
} from "@/components/book-detail/purchase-dialog"
import { ShareButton } from "@/components/book-detail/share-button"
import { toastSaveError } from "@/components/site/save-error"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardFooter } from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { openLibraryUrl, type ForeignBook } from "@/lib/foreign"
import { useForeignBooks, useHydrated, usePurchases } from "@/lib/store"
import { cn } from "@/lib/utils"

const rowClass = "rounded-none gap-x-3 gap-y-2 px-5 py-4"
const actionClass = "h-10 px-4"

/** Opens Open Library in a new tab; the icon says it leaves the site. */
function OpenLibraryLink({
  href,
  label,
  variant,
}: {
  href: string
  label: string
  variant: "default" | "outline"
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size: "lg" }), actionClass)}
    >
      <ExternalLinkIcon data-icon="inline-start" />
      {label}
      <span className="sr-only"> (در پنجرهٔ تازه)</span>
    </a>
  )
}

/**
 * The PurchaseCard flow for Open Library books: same dialog and storage,
 * but no reader; reading happens on Open Library.
 */
export function ForeignPurchaseCard({
  book,
  className,
}: {
  book: ForeignBook
  className?: string
}) {
  const hydrated = useHydrated()
  const { isPurchased } = usePurchases()
  const { remember: rememberBook } = useForeignBooks()
  // The library needs these details to list the book; say so if they're lost.
  const remember = (item: ForeignBook) => {
    if (!rememberBook(item)) toastSaveError("مشخصات کتاب ذخیره نشد")
  }
  const [dialogOpen, setDialogOpen] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)
  const purchased = hydrated && isPurchased(book.id)
  const olUrl = openLibraryUrl(book.workId)

  const purchaseBook: PurchaseBook = {
    id: book.id,
    title: book.title,
    type: "ebook",
    authors: book.authors,
    image: book.cover,
    finalPrice: book.price,
  }

  return (
    <Card className={cn("gap-0 py-0", className)}>
      <ItemGroup className="gap-0">
        <Item role="listitem" className={rowClass}>
          <ItemMedia variant="icon" className="text-muted-foreground">
            <GlobeIcon />
          </ItemMedia>
          <ItemContent className="min-w-52">
            <ItemTitle>نسخهٔ الکترونیکی به زبان اصلی</ItemTitle>
            <ItemDescription className="line-clamp-none">
              یک بار بخرید، همیشه در کتابخانهٔ شما
            </ItemDescription>
          </ItemContent>
          <ItemActions className="ms-auto gap-2.5">
            {purchased ? (
              <Badge variant="accent" className="h-6 px-2.5">
                <LibraryBigIcon data-icon="inline-start" />
                در کتابخانهٔ شما
              </Badge>
            ) : (
              <PriceTag
                book={{ finalPrice: book.price, free: false }}
                className="text-lg"
              />
            )}
          </ItemActions>
        </Item>
        <ItemSeparator className="my-0" />
        <Item role="listitem" className={rowClass}>
          <ItemMedia variant="icon" className="text-accent-foreground">
            <ExternalLinkIcon />
          </ItemMedia>
          <ItemContent className="min-w-52">
            <ItemTitle>نسخهٔ خواندنی این کتاب در Open Library است</ItemTitle>
            <ItemDescription className="line-clamp-none">
              کتاب‌خوان سایت فقط کتاب‌های فارسی را باز می‌کند؛ متن یا امانت
              دیجیتال این کتاب را در Open Library ببینید.
            </ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>

      <CardFooter className="flex flex-wrap items-center gap-2 px-5 py-4">
        <div ref={actionsRef} className="contents">
          {!hydrated ? (
            <Skeleton
              aria-hidden="true"
              className={cn(actionClass, "w-36 rounded-lg")}
            />
          ) : purchased ? (
            <OpenLibraryLink
              href={olUrl}
              label="مشاهده در Open Library"
              variant="default"
            />
          ) : (
            <Button
              size="lg"
              className={actionClass}
              onClick={() => setDialogOpen(true)}
            >
              <ShoppingBagIcon data-icon="inline-start" />
              خرید کتاب
            </Button>
          )}
        </div>
        {hydrated && !purchased ? (
          <OpenLibraryLink
            href={olUrl}
            label="مشاهده در Open Library"
            variant="outline"
          />
        ) : null}

        <div className="ms-auto flex items-center gap-2">
          <FavoriteButton
            bookId={book.id}
            title={book.title}
            onToggle={(added) => {
              if (added) remember(book)
            }}
          />
          <ShareButton />
        </div>
      </CardFooter>

      <PurchaseDialog
        book={purchaseBook}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onPurchased={() => remember(book)}
        successAction={
          <a
            href={olUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ size: "lg" })}
          >
            <ExternalLinkIcon data-icon="inline-start" />
            خواندن در Open Library
            <span className="sr-only"> (در پنجرهٔ تازه)</span>
          </a>
        }
        finalFocus={() =>
          actionsRef.current?.querySelector<HTMLElement>("a, button") ?? null
        }
      />
    </Card>
  )
}
