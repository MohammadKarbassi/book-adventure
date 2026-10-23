import type { Metadata } from "next"
import { Vazirmatn, Markazi_Text, Geist_Mono } from "next/font/google"

import "./globals.css"
import { INTRO_HEAD_SCRIPT } from "@/components/intro/intro-timeline"
import { MiniPlayer } from "@/components/player/mini-player"
import { PlayerProvider } from "@/components/player/player-provider"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { DirectionProvider } from "@/components/ui/direction"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const fontSans = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
})

const fontHeading = Markazi_Text({
  subsets: ["arabic", "latin"],
  variable: "--font-heading",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  // Absolute base for the shared preview image (app/opengraph-image.png).
  metadataBase: new URL("https://book-adventure.vercel.app"),
  title: {
    template: "%s | ماجراجویی با کتاب",
    default: "ماجراجویی با کتاب",
  },
  description: "ماجراجویی با کتاب؛ پلتفرم کتاب الکترونیکی فارسی",
  openGraph: {
    siteName: "ماجراجویی با کتاب",
    locale: "fa_IR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={cn(
        "scroll-pt-20 antialiased",
        fontMono.variable,
        "font-sans",
        fontSans.variable,
        fontHeading.variable
      )}
    >
      <head>
        {/* Decides before the first paint whether the intro may show. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_HEAD_SCRIPT }} />
      </head>
      <body className="flex min-h-svh flex-col">
        <DirectionProvider direction="rtl">
          <ThemeProvider>
            <TooltipProvider>
              <PlayerProvider>
                <a
                  href="#main"
                  className={cn(
                    buttonVariants(),
                    "sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-3 focus:z-50"
                  )}
                >
                  پرش به محتوای اصلی
                </a>
                <SiteHeader />
                <main id="main" tabIndex={-1} className="flex-1 outline-none">
                  {children}
                </main>
                <SiteFooter />
                <MiniPlayer />
                <Toaster position="bottom-left" richColors={false} dir="rtl" />
              </PlayerProvider>
            </TooltipProvider>
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  )
}
