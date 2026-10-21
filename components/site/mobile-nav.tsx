"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon } from "lucide-react"

import {
  getCategoryIcon,
  isActivePath,
  libraryLink,
  mainLinks,
  type NavCategory,
} from "@/components/site/nav-config"
import { ThemeToggleButton } from "@/components/site/theme-toggle"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const itemClass =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0"

export function MobileNav({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const links = [...mainLinks, libraryLink]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="منو"
            className="md:hidden"
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="right" className="w-80 gap-0">
        <SheetHeader className="border-b">
          <SheetTitle className="font-heading text-2xl font-bold">
            ماجراجویی با کتاب
          </SheetTitle>
          <SheetDescription>کتاب، کتاب صوتی و پادکست فارسی</SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <nav aria-label="منوی اصلی" className="flex flex-col gap-1 p-3">
            {links.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  aria-current={
                    isActivePath(pathname, link.href) ? "page" : undefined
                  }
                  className={itemClass}
                >
                  <Icon />
                  {link.label}
                </Link>
              )
            })}
            <Separator className="my-2" />
            <h2 className="px-3 pb-1 text-xs font-medium text-muted-foreground">
              دسته‌بندی‌ها
            </h2>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.slug)
              const href = `/category/${category.slug}`
              return (
                <Link
                  key={category.slug}
                  href={href}
                  onClick={close}
                  aria-current={
                    isActivePath(pathname, href) ? "page" : undefined
                  }
                  className={cn(itemClass, "font-normal")}
                >
                  <Icon />
                  <span className="flex-1">{category.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(category.count)}
                  </span>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
        <SheetFooter className="border-t">
          <ThemeToggleButton />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
