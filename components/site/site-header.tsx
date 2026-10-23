import { LibraryButton } from "@/components/site/library-button"
import { MainNav } from "@/components/site/main-nav"
import { MobileNav } from "@/components/site/mobile-nav"
import type { NavCategory } from "@/components/site/nav-config"
import {
  SearchCommand,
  type SearchIndex,
} from "@/components/site/search-command"
import { SiteLogo } from "@/components/site/site-logo"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { Container } from "@/components/site/container"
import { getAllBooks, getBooksByCategory, getCategories } from "@/lib/catalog"
import { getAdventureSearchItems } from "@/lib/adventure-search-items"
import { getPodcasts } from "@/lib/podcasts"

function getNavCategories(): NavCategory[] {
  return getCategories().map((category) => ({
    slug: category.slug,
    title: category.title,
    count: getBooksByCategory(category.slug).length,
  }))
}

// Only the fields the command palette shows and matches on.
function getSearchIndex(): SearchIndex {
  return {
    adventures: getAdventureSearchItems(),
    books: getAllBooks().map((book) => ({
      id: book.id,
      title: book.title,
      authors: book.authors,
      narrators: book.narrators,
      type: book.type,
      image: book.image,
    })),
    podcasts: getPodcasts().map((podcast) => ({
      id: podcast.id,
      title: podcast.title,
      author: podcast.author,
      artwork: podcast.artwork,
    })),
  }
}

export function SiteHeader() {
  const categories = getNavCategories()

  return (
    <header
      data-site-header=""
      className="sticky top-0 z-40 border-b bg-background/80 text-foreground backdrop-blur-md transition-[background-color,border-color,color] duration-240 ease-out supports-backdrop-filter:bg-background/70 motion-reduce:transition-none"
    >
      <Container className="flex h-16 items-center gap-6">
        <SiteLogo />
        <MainNav categories={categories} />
        <div className="ms-auto flex items-center gap-1">
          <SearchCommand index={getSearchIndex()} />
          <LibraryButton className="hidden lg:inline-flex" />
          <ThemeToggle className="hidden lg:inline-flex" />
          <MobileNav categories={categories} />
        </div>
      </Container>
    </header>
  )
}
