import type { Metadata } from "next"
import { Vazirmatn, Markazi_Text, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DirectionProvider } from "@/components/ui/direction"
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
  title: {
    template: "%s | ماجراجویی با کتاب",
    default: "ماجراجویی با کتاب",
  },
  description: "ماجراجویی با کتاب؛ پلتفرم کتاب الکترونیکی فارسی",
  openGraph: {
    siteName: "ماجراجویی با کتاب",
    locale: "fa_IR",
  },
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
        "antialiased",
        fontMono.variable,
        "font-sans",
        fontSans.variable,
        fontHeading.variable
      )}
    >
      <body>
        <DirectionProvider direction="rtl">
          <ThemeProvider>{children}</ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  )
}
