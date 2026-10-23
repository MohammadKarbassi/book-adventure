import Link from "next/link"

import { Container } from "@/components/site/container"
import { SiteBrand } from "@/components/site/site-logo"
import { Separator } from "@/components/ui/separator"
import { getCategories } from "@/lib/catalog"

type FooterColumn = {
  title: string
  links: { href: string; label: string }[]
}

export function SiteFooter() {
  const columns: FooterColumn[] = [
    {
      title: "دسته‌ها",
      links: getCategories().map((category) => ({
        href: `/category/${category.slug}`,
        label: category.title,
      })),
    },
    {
      title: "قفسه‌های دیگر",
      links: [
        { href: "/#adventure-shelf", label: "سفر ماجراجویی" },
        { href: "/audiobooks", label: "کتاب‌های صوتی" },
        { href: "/podcasts", label: "پادکست‌ها" },
        { href: "/foreign", label: "کتاب‌های خارجی" },
      ],
    },
    {
      title: "حساب من",
      links: [
        { href: "/library", label: "کتابخانهٔ من" },
        { href: "/subscription", label: "اشتراک" },
      ],
    },
  ]

  return (
    <footer className="mt-24 border-t bg-muted/40">
      <Container className="flex flex-col gap-10 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_2fr_1fr_1fr]">
          <div className="flex max-w-xs flex-col gap-3">
            <SiteBrand />
            <p className="text-sm/relaxed text-muted-foreground">
              کتاب الکترونیکی، کتاب صوتی و پادکست فارسی؛ هر کتاب، یه کشف تازه.
            </p>
          </div>
          {columns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="flex flex-col gap-3"
            >
              <h2 className="font-heading text-xl font-bold">{column.title}</h2>
              <ul
                className={
                  column.links.length > 4
                    ? "grid grid-cols-2 gap-x-6 gap-y-2"
                    : "flex flex-col gap-2"
                }
              >
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <Separator />
        <p className="text-xs/relaxed text-muted-foreground">
          داده‌های کتاب از فیدیبو · کتاب‌های خارجی از Open Library · پادکست‌ها
          از فیدهای عمومی RSS · صداهای نمونه از Internet Archive با مجوز آزاد ·
          پروژهٔ آموزشی بوت‌کمپ
        </p>
      </Container>
    </footer>
  )
}
