# Shelf journey title refinement

Mode: Experience. Preserve the approved warm paper/amber book world and exact journey title. User approved a typography-led refinement, not new artwork or a new brand.

Title: Markazi Text700, fluid32–48px phone (10vw, to avoid an orphaned «شما») /60px tablet /72px large desktop, line-height1.15. Navy/semantic foreground with only «ماجراجویی» in semantic accent ink. Body label14→16px below the title; personalization remains conditional and quieter.

Layout: header and book list share centered82%/52% widths with52rem maximum. Native-flow title replaces the far-edge256px absolute block. Keep room above the first spine for its hovering cover. Preserve the hero h1, shelf h2, native links and number/order behavior.

Clearance follow-up: desktop top padding is32px (title raised32px); first-spine gap is max(20svh,min(18vw,18rem)), not viewport-height-only. This reserves space for the width-scaled projected cover and conditional personalization in wide/short windows. Phone spacing is unchanged.

Motion: whole Persian words (not letters) settle RTL over400ms with80ms spacing, once when header enters viewport. Keep title visible by default at65% opacity, no loop. Reduced-motion CSS forces full opacity and no transform. No new fonts, raster assets, UI components or dependencies.

Quality bar: title dominates metadata; title/list alignment; intact Persian joining; desktop/mobile/dark/reduced motion; first hover cover clear of title; personalized note unchanged in meaning; existing shelf/material/media/routing tests remain green.
