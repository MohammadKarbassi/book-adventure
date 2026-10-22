---
name: Book Adventure
description: Warm illustrated book journey, physical shop motion and continuous adventure interiors.
colors:
  primary: "oklch(0.79 0.15 72)"
  primary-foreground: "oklch(0.22 0.03 258)"
  background: "oklch(0.975 0.012 85)"
  foreground: "oklch(0.24 0.03 258)"
  card: "oklch(0.993 0.006 85)"
  secondary: "oklch(0.94 0.014 85)"
  muted-foreground: "oklch(0.5 0.025 258)"
  accent: "oklch(0.93 0.035 200)"
  accent-foreground: "oklch(0.42 0.08 200)"
  border: "oklch(0.89 0.015 85)"
  input: "oklch(0.87 0.015 85)"
  ring: "oklch(0.72 0.14 72)"
  destructive: "oklch(0.58 0.2 27)"
typography:
  headline:
    fontFamily: "Markazi Text, serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
  narrative:
    fontFamily: "Markazi Text, serif"
    fontSize: "1.5rem"
    lineHeight: 1.7
  narrative-desktop:
    fontFamily: "Markazi Text, serif"
    fontSize: "1.75rem"
    lineHeight: 1.7
  title:
    fontFamily: "Markazi Text, serif"
    fontSize: "1.875rem"
  body:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "0.875rem"
    lineHeight: 1.625
  label:
    fontFamily: "Vazirmatn, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
rounded:
  book-edge: "3px"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  badge: "1.625rem"
spacing:
  1: "0.25rem"
  2: "0.5rem"
  4: "1rem"
  6: "1.5rem"
  10: "2.5rem"
  12: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 0.625rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 0.625rem"
  button-ghost:
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0 0.625rem"
  button-link:
    textColor: "{colors.primary}"
    height: "2rem"
    padding: "0 0.625rem"
  input:
    rounded: "{rounded.lg}"
    height: "2rem"
    padding: "0.25rem 0.625rem"
  badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.badge}"
    height: "1.25rem"
    padding: "0.125rem 0.5rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1rem"
---

# Design System: Book Adventure

## Overview

**Creative North Star: "Paper and Lantern"**

This is a source-grounded snapshot of the completed book-material and adventure-interior refinement on 2026-10-22. The existing theme names paper, navy ink, saffron and turquoise; Persian editorial type and physically lit books carry that identity. The material/ending review covers those surfaces only and does not establish whole-page approval.

The home now implements the user's warm paper-and-amber direction: an original illustrated book opens into a mountain path beside the project title. The shelf inherits the paper theme rather than forcing dark mode, and the shop header stays available. Shared shop cards tilt around their binding edge and briefly pull outward before navigation. These are project-specific design choices, not claims about Stripe's implementation.

**Key Characteristics:**

- Persian RTL reading and native interactive DOM.
- Editorial headings beside legible sans-serif utility text.
- Cover-derived rooms and matte, physically modeled books.
- Theme-aware shopping and a reversible transition into audio content.

## Colors

Warm paper and saffron sit against navy ink, with restrained turquoise utility accents. Frontmatter preserves the normative light-theme OKLCH values from app/globals.css.

### Primary

- **Saffron:** primary actions, selected badges and emphasis; paired with the dedicated dark primary foreground.

### Secondary

- **Turquoise wash and ink:** accent backgrounds and their matching readable foreground; active shop navigation uses the accent foreground.

### Neutral

- **Paper:** page background.
- **Raised paper:** cards and popovers.
- **Navy ink:** primary text; softer ink serves secondary metadata.
- **Quiet paper:** secondary surfaces and muted fills.
- **Paper edge:** borders and input strokes; the saffron ring marks keyboard focus.
- **Error red:** destructive and invalid states, not a promotional accent.

The .dark declarations in app/globals.css are a separate source-defined theme, not a generated inversion. For example, dark background is oklch(0.17 0.025 258), foreground oklch(0.95 0.012 85), and primary oklch(0.8 0.15 75). Consume the live semantic variables so that other dark values remain authoritative in that file. Adventure rooms additionally use the existing catalog palettes and matching text tones; these per-book values are not universal brand colors.

**The Semantic Ink Rule.** Pair each themed surface with its corresponding foreground; cover-specific rooms retain their own readable text tone.

## Typography

**Display Font:** Markazi Text, serif fallback.
**Body Font:** Vazirmatn, sans-serif fallback.

The font pairing is loaded through next/font in app/layout.tsx. Markazi Text gives titles, narratives and quotations an editorial voice; Vazirmatn carries controls, authors, prices and supporting text. Geist Mono is registered but is not promoted to a new visual role without a demonstrated use.

### Hierarchy

- **Shelf display:** «سفر ماجراجویی شما» uses fluid32–48px phone (10vw) /60px tablet /72px large desktop, Markazi700 with1.15 leading. Only «ماجراجویی» uses accent ink. Header and shelf share one centered width; supporting label14→16px follows the heading, with conditional personalization below. Whole-word RTL entrance runs once; reduced motion removes displacement.
- **Headline:** frontmatter role is the mobile adventure title; it grows to 3rem from 640px, retaining 700 weight and 1.15 line-height.
- **Narrative:** frontmatter role grows to 1.75rem from 640px, retaining 1.7 line-height. The source uses a prose-width text block.
- **Title:** the listening epilogue heading uses 3.75rem, then 6rem at 900px; its paper closing heading uses 3rem, then 4.5rem. Both use 1.25 line-height.
- **Body:** supporting adventure copy uses the body role; epilogue copy uses 1.125rem with 2 line-height, with explicit sample disclosure at the label size.
- **Label:** compact metadata and control hints. Do not infer a universal uppercase or letter-spacing system from individual treatments.

**The Connected Script Rule.** Preserve joined Persian letterforms and RTL reading order; the intro animates Persian words rather than isolated letters.

## Layout

The shared shop container is centered, full-width, capped at 80rem, with 1rem inline padding increasing to 1.5rem at 640px. Existing repeated gaps include the frontmatter spacing steps; these describe observed use rather than a requirement to fill every scale interval.

Adventure interiors switch at 900px to a centered container capped at min(84vw, 1280px): 42% text and 58% model, mirrored for RTL. Desktop content starts at 20svh, with 14svh bottom padding; below that breakpoint a model anchor precedes a single reading column. Praise uses one column initially, two from 640px, and three from 900px, with 4vw horizontal gaps and 2.5rem vertical gaps.

The listening epilogue uses a minimum viewport-height region, 80rem maximum width, 1.75rem inline padding and 5rem block padding; desktop padding becomes 7rem. At 900px the main narrative and actual audiobook cover form two columns, with a native podcast discovery strip below. A sticky viewport-height original illustration remains behind the content while an opaque warm-paper closing surface scrolls over it. The ending layer covers the preceding fixed book navigation rather than letting pale room ink leak onto paper.

Observed shelf geometry is 82% width on small screens, 52% from 768px, capped at 52rem; gaps are clamp(2.5rem,7svh,5rem). The preceding hero uses a 42/58 text/illustration split from 768px and stacks text before imagery on mobile. Its brand heading uses 60/72/96px steps; the shelf title is a subordinate h2.

**The Native Reading Rule.** Keep text, purchase controls, links and drag anchors in DOM and preserve native scrolling while the canvas provides book imagery.

## Elevation & Depth

Depth is structural and material: actual book boards, spines, page blocks, perspective, lighting and spring motion. It also includes ambient CSS shadows on fallback books and ending artwork. This is not a shadow-free system, and its book shading must not be prohibited as decorative excess.

Shelf MeshStandardMaterial uses matte roughness 0.96, metalness 0, bumpScale 0.55; paper uses roughness 0.98 and bumpScale 0.15. The interior front uses roughness 0.78, metalness 0, and bumpScale equal to model width times 0.0006; spine/back/edge values remain local in adventure-scene.tsx, not interchangeable site-wide elevation tokens.

The shared original book-cloth-height.webp is a height map, not printed cover color. Mirrored repeat and face-aspect-aware UV density preserve the physical scale across wide spines and vertical covers. Roughness uses its separate matte map; deterministic generated relief is the load-failure fallback. Front cover derivatives come from the existing catalog; generated backs, spines and page edges are substitutes, not scanned originals or copied Stripe assets.

**The Material Truth Rule.** Preserve separate cover color, cloth height and matte roughness; do not describe the generated relief as a genuine per-book foil or emboss map.

## Shapes

Controls use the theme's compact rounded corners; cards use the larger xl radius, badges a pill-like radius. Book edges use a narrow 3px CSS silhouette, with 2px cover-face corners in the fallback. The 3D book binding is on the right for Persian books. These distinct geometries follow the object and do not require all surfaces to become cards.

## Components

### Buttons

Base UI/shadcn variants supply compact medium-weight controls. The default primary, outline, secondary, ghost, destructive and link variants come from components/ui/button.tsx. Primary hover reduces the fill to 80% opacity. Focus uses a 3px ring with a matching border; active controls move down 1px where applicable. Disabled controls are half-opacity and noninteractive. Link buttons in the ending intentionally use foreground ink and zero horizontal padding.

### Chips

Badge variants share a compact pill form and 20px height, with primary, secondary, accent and outline treatments. Interactive badges inherit hover and focus feedback; do not represent noninteractive metadata as a button.

### Cards / Containers

The reusable card uses raised paper, an xl radius and a subtle 1px foreground ring at 10% opacity. Default internal spacing is 1rem, or 0.75rem in the small variant. Adventure narrative remains an open reading composition rather than a sequence of these cards.

### Inputs / Fields

The shared field is transparent in light mode, uses the input stroke, and gains the same 3px focus ring as buttons. It is 32px high; text is 1rem before the 768px breakpoint, then 0.875rem. Invalid states use destructive ink and ring; disabled fields reduce opacity.

### Navigation

The shop header is sticky, 64px tall, with a paper background at 80% opacity and medium backdrop blur; main navigation appears from 768px with a mobile alternative below. Active links use turquoise ink. Keep the shop header and search available throughout the shelf. Only immersive adventures have their own native rail and site mark in place of site chrome.

### Physical books and journey ending

The illustrated hero responds only to mouse movement, with bounded 3° horizontal and 2° vertical depth and a damped return. Shared shop covers tilt 9° and lift 6px on hover/focus; navigation uses a 240ms pull-out with cubic-bezier(0.22,1,0.36,1). Reduced motion disables these effects and navigates immediately; modified clicks retain native link behavior. The illustration is a local original asset with provenance in public/hero/manifest.json.

A fixed Three.js canvas renders shelf books; another fixed scene serves the adventure route on desktop and mobile. CSS 3D remains the no-WebGL fallback, with native links, focus and drag anchors. Shelf hover/focus reveals a cover band, lifts toward the viewer and reveals a price chip. Tilt and lift use distinct springs recorded in the sidecar; reduced-motion handling remains in the source.

The interior keeps neighboring models in the same scene. Book activation follows the 25% desktop / 30% mobile viewport trigger and keeps route, palette, rail and active model aligned. The ending progressively clips the canvas over one viewport as real audio/podcast DOM content and footer enter; scrolling back reverses the reveal. This is the project's own content adaptation, not an identity rule for unrelated screens.

The ending's sample action uses the existing global player, without autoplay or history mutation. Its disclosure distinguishes the freely licensed demonstration recording from the displayed book's original audio. Stable `--ending-paper` and `--ending-ink` preserve the brand paper/ink pair outside cover-derived room variables. Footer anchors return directly to the home shelf or shop. Original imagery is reused from the project's hero, not copied from the reference.

## Do's and Don'ts

### Homepage media continuation

After the last shelf books, the surface gradually moves into the semantic `--home-media-night` stage; this is a bounded narrative transition, not a forced dark theme for the whole shelf. A native-flow portrait sheet unfolds through four horizontal hinges between five panels. It preserves the user's unframed Apollo print at96svh desktop and width-bounded on phones. Individually phased panel slopes and isolated grazing light make the creases readable without changing shelf lighting. Folding spans140% viewport with220ms exponential settling. The existing renderer reveals an independent podcast camera/scene from below using complementary scissors. The user-selected Houston astronaut cover is28svh (bounded160–272px), matched to Houston metadata/audio, against the supplied Earth-horizon photograph. Opaque `--ending-paper` returns to shopping. Native DOM controls, no autoplay, reversible scroll, reduced-motion and no-WebGL images are mandatory. Source evidence and local coefficients are separated in `docs/home-media-reference-findings.md`.

### Do:

- **Do** preserve semantic theme variables and readable surface/foreground pairs.
- **Do** keep Persian RTL reading, logical inline spacing and native interactive DOM.
- **Do** preserve cover proportions and separate color, height and roughness maps.
- **Do** keep book motion responsive to pointer, keyboard and reduced-motion settings.

### Don't:

- **Don't** copy Stripe artwork, text, fonts or material maps.
- **Don't** present generated backs, spines or relief as authentic per-book scans.
- **Don't** force the whole home shelf into dark mode independently of the site's theme; its bounded media ending may transition into night.
- **Don't** animate book navigation when reduced motion is requested.

The shelf's introductory line preserves the user's specified content; it is not a generic label style for unrelated sections.

Source evidence: app/globals.css; app/layout.tsx; components/ui/{button,input,badge,card}.tsx; components/site/{container,site-header,main-nav}.tsx; components/home/{book-shelf,shelf-book,shelf-scene}.tsx; components/book/book-materials.ts; components/adventures/{adventure-section,adventure-scene,journey-ending}.tsx. Context: PRODUCT.md and docs/stripe-press-design-basis.md.
