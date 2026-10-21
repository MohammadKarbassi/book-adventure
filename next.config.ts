import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    // Covers and artwork load straight from their CDNs in the browser. The
    // Fidibo CDN rejects non-browser fetchers, and some local proxies resolve
    // it to a private IP that the Next.js optimizer refuses.
    unoptimized: true,
    remotePatterns: [
      // Fidibo book covers (data/catalog.json)
      { protocol: "https", hostname: "cdn.fidibo.com", pathname: "/**" },
      // Open Library covers (foreign books)
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/**",
      },
      // Apple Podcasts artwork
      { protocol: "https", hostname: "*.mzstatic.com", pathname: "/**" },
    ],
  },
}

export default nextConfig
