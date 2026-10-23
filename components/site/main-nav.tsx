"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  getCategoryIcon,
  isActivePath,
  mainLinks,
  type NavCategory,
} from "@/components/site/nav-config"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function MainNav({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname()

  return (
    <NavigationMenu aria-label="منوی اصلی" className="hidden lg:flex">
      <NavigationMenuList className="gap-1">
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              pathname.startsWith("/category/") && "text-accent-foreground"
            )}
          >
            دسته‌بندی‌ها
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[34rem] grid-cols-2 gap-1 p-1">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.slug)
                const href = `/category/${category.slug}`
                return (
                  <li key={category.slug}>
                    <NavigationMenuLink
                      active={isActivePath(pathname, href)}
                      closeOnClick
                      render={<Link href={href} />}
                      className="gap-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Icon />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium">{category.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(category.count)} کتاب
                        </span>
                      </span>
                    </NavigationMenuLink>
                  </li>
                )
              })}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        {mainLinks.map((link) => {
          const active = isActivePath(pathname, link.href)
          return (
            <NavigationMenuItem
              key={link.href}
              className={cn(link.wideOnly && "hidden xl:block")}
            >
              <NavigationMenuLink
                active={active}
                render={<Link href={link.href} />}
                className={cn(
                  navigationMenuTriggerStyle(),
                  active && "text-accent-foreground"
                )}
              >
                {link.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
