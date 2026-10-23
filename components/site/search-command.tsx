"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { RouteIcon, SearchIcon } from "lucide-react"

import { BookCover } from "@/components/book/book-cover"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import type { BookType } from "@/lib/catalog"
import {
  matchAdventures,
  type AdventureSearchItem,
} from "@/lib/adventure-search"
import { normalizePersian } from "@/lib/text"

export type SearchIndex = {
  adventures?: AdventureSearchItem[]
  books: {
    id: number
    title: string
    authors: string[]
    narrators?: string[]
    type: BookType
    image: string
  }[]
  podcasts: {
    id: string
    title: string
    author: string
    artwork: string
  }[]
}

const placeholder = "جستجوی کتاب، نویسنده، گوینده…"
const groupLimit = 6

/** Same matching as lib/catalog searchBooks: normalized, spaces ignored. */
const toHaystack = (parts: string[]) =>
  normalizePersian(parts.join("|")).replace(/ /g, "")

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

export function SearchCommand({ index }: { index: SearchIndex }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
        return
      }
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const haystacks = useMemo(
    () => ({
      books: index.books.map((book) =>
        toHaystack([book.title, ...book.authors, ...(book.narrators ?? [])])
      ),
      podcasts: index.podcasts.map((podcast) =>
        toHaystack([podcast.title, podcast.author])
      ),
    }),
    [index]
  )

  const trimmed = query.trim()

  const results = useMemo(() => {
    const terms = normalizePersian(query).split(" ").filter(Boolean)
    const matches = (haystack: string) =>
      terms.every((term) => haystack.includes(term))

    const adventures = matchAdventures(index.adventures ?? [], query).slice(
      0,
      groupLimit
    )
    const books = index.books.filter((_, i) => matches(haystacks.books[i]))
    return {
      adventures,
      ebooks: books
        .filter((book) => book.type === "ebook")
        .slice(0, groupLimit),
      audiobooks: books
        .filter((book) => book.type === "audiobook")
        .slice(0, groupLimit),
      podcasts: index.podcasts
        .filter((_, i) => matches(haystacks.podcasts[i]))
        .slice(0, groupLimit),
    }
  }, [index, haystacks, query])

  const hasResults =
    results.adventures.length +
      results.ebooks.length +
      results.audiobooks.length +
      results.podcasts.length >
    0

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setQuery("")
  }

  function go(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <>
      <Button
        variant="outline"
        aria-label="جستجو"
        onClick={() => setOpen(true)}
        className="hidden w-80 justify-start gap-2 bg-muted/50 font-normal text-muted-foreground shadow-none xl:inline-flex dark:bg-input/20"
      >
        <SearchIcon />
        <span className="truncate">{placeholder}</span>
        <Kbd className="ms-auto" dir="ltr">
          ⌘K
        </Kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="جستجو"
        onClick={() => setOpen(true)}
        className="xl:hidden"
      >
        <SearchIcon />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        title="جستجو"
        description="جستجوی کتاب، کتاب صوتی و پادکست"
        className="sm:max-w-xl"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
          />
          <CommandList className="max-h-[min(60vh,28rem)]">
            <CommandEmpty>نتیجه‌ای پیدا نشد</CommandEmpty>
            {results.adventures.length > 0 ? (
              <CommandGroup heading="ماجراجویی‌ها">
                {results.adventures.map((adventure) => (
                  <CommandItem
                    key={adventure.bookId}
                    value={`adventure-${adventure.bookId}`}
                    onSelect={() => go(`/adventures/${adventure.bookId}`)}
                    className="gap-3"
                  >
                    <RouteIcon />
                    <ItemText
                      title={adventure.name}
                      subtitle={adventure.tagline}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {results.ebooks.length > 0 ? (
              <CommandGroup heading="کتاب‌ها">
                {results.ebooks.map((book) => (
                  <BookItem
                    key={book.id}
                    book={book}
                    subtitle={book.authors.join("، ")}
                    onSelect={() => go(`/book/${book.id}`)}
                  />
                ))}
              </CommandGroup>
            ) : null}
            {results.audiobooks.length > 0 ? (
              <CommandGroup heading="کتاب‌های صوتی">
                {results.audiobooks.map((book) => (
                  <BookItem
                    key={book.id}
                    book={book}
                    subtitle={
                      book.narrators?.length
                        ? `گوینده: ${book.narrators.join("، ")}`
                        : book.authors.join("، ")
                    }
                    onSelect={() => go(`/book/${book.id}`)}
                  />
                ))}
              </CommandGroup>
            ) : null}
            {results.podcasts.length > 0 ? (
              <CommandGroup heading="پادکست‌ها">
                {results.podcasts.map((podcast) => (
                  <CommandItem
                    key={podcast.id}
                    value={`podcast-${podcast.id}`}
                    onSelect={() => go(`/podcasts/${podcast.id}`)}
                    className="gap-3"
                  >
                    <Image
                      src={podcast.artwork}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 shrink-0 rounded-md bg-muted object-cover"
                    />
                    <ItemText title={podcast.title} subtitle={podcast.author} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {trimmed && hasResults ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="search-all"
                    onSelect={() =>
                      go(`/search?q=${encodeURIComponent(trimmed)}`)
                    }
                  >
                    <SearchIcon />
                    <span className="truncate">
                      دیدن همهٔ نتایج برای «{trimmed}»
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

function BookItem({
  book,
  subtitle,
  onSelect,
}: {
  book: SearchIndex["books"][number]
  subtitle: string
  onSelect: () => void
}) {
  return (
    <CommandItem
      value={`book-${book.id}`}
      onSelect={onSelect}
      className="gap-3"
    >
      <BookCover
        book={{ title: "", image: book.image }}
        size="sm"
        sizes="32px"
        className="w-8 shadow-sm"
      />
      <ItemText title={book.title} subtitle={subtitle} />
    </CommandItem>
  )
}

function ItemText({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium">{title}</span>
      <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
    </span>
  )
}
