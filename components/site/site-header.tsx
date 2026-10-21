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
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <Container className="flex h-16 items-center gap-6">
        <SiteLogo />
        <MainNav categories={categories} />
        <div className="ms-auto flex items-center gap-1">
          <SearchCommand index={getSearchIndex()} />
          <LibraryButton className="hidden md:inline-flex" />
          <ThemeToggle className="hidden md:inline-flex" />
          <MobileNav categories={categories} />
        </div>
      </Container>
    </header>
  )
}
