import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
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
