# Home media scroll implementation plan

> Approved execution: direct construction in the existing checkout; preserve all interior decisions. Native implementation with a bounded finish review.

Goal: extend the HOME shelf into a folding audiobook poster, an independent podcast world, then a warm paper shop entrance. Existing interior epilogue is not the implementation target.

1. Write failing unit tests for `posterOpening(sectionTop, viewportHeight, reduced)` and continuous `foldPosterPoint(x,y,opening)` (unit portrait width 1, height 1.5). Prove unfolded identity, finite folds, continuity and reversible/clamped scroll progress.
2. Add `home-media-math.ts`, `shelf-poster.ts` and `home-media-journey.tsx`. Poster shares ShelfScene's renderer/lights, deforms a segmented plane and preserves native image fallback, reduced motion, context loss and disposal. Sections use native document flow; only audio holds for its unfolding moment. Podcast enters independently from below. No scrolling history writes.
3. Wire serializable tracks from `app/page.tsx`: existing audiobook sample and a static snapshot of an official NASA podcast episode. Source/provenance stays explicit. Add two scoped shelf destinations/active states without changing the 14-book ordering. Original assets live in public/home-media/.
4. Add browser regression coverage for actual homepage placement, folding/reverse progress, single-canvas fallback, podcast/native audio controls, paper/shop layering, stable history, mobile and reduced motion.
5. Run lint/typecheck/unit/webpack build and browser specs against production. Inspect one batched desktop/mobile/transition round, apply one material batch, confirm once. Refresh handoff/design snapshot, commit the finished capability; no automatic push unless requested.

Reference facts: saved REA evidence shows a 100×100 segmented film plane, mutable vertex positions/normals and separate scissor-rendered podcast scene. Video confirms folded poster → flat poster → overlapping podcast entrance → opaque light footer. Local geometry, coefficients, artwork and DOM podcast approach are project choices, not copied source.

Review focus: no WebGL/context loss; reverse scroll; lazy image readiness; repeated native audio controls; mobile overflow and reduced motion; unchanged interior routing and home shelf tests.
