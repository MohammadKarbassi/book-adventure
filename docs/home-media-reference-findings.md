# Homepage ending: corrective reference findings

Scope: HOME `/`, not the interior ending. User requested closer implementation after the first prototype.

## Confirmed

- Video: last books → folded portrait → almost-flat portrait moving upward → separate podcast entering from below along a sharp horizontal boundary → opaque light footer.
- Retained REA Evidence `ev_ed7a949e47fdf6d8e223f07dcf14ac4c62b6765b32d95c71a2a064efe63c8134`, source `https://b.stripecdn.com/mkt-statics-srv/assets/v1-chunk-Y2WAJ6AV.js`: film uses a 22×30 plane with a 100×100 vertex grid. Vertex positions and normals deform; poster follows product/camera space, not a pinned 175vh card. Small crease remains at the minimum deformation. Book/film and podcast use separate scene renders with complementary scissors in ONE renderer.
- Podcast source has a separate camera, fog, central loaded model and scroll-driven background/fog parameters. At about 90% entry a bounded time-based flip begins. Not every original motion is directly scroll-bound.
- Read-only CDP sample at 1200×879 CSS px: film top 3473.77/height648.46 (0.738vh), podcast top4322.23/height879 (1vh), footer top5201.23/height1186.38/relative z4. Fixed film background. These are one responsive sample, not fixed layout constants.

## Prototype mismatches

Poster was too small (58svh), held by sticky for175svh, disconnected by a hard ground seam and large gap. Its separate caption made it read as an illustration rather than a printed poster. Podcast was only a static DOM image with a small cover. Paper shop reveal was structurally correct.

## Local corrections, not Stripe claims

Dim trailing books into the listening ground; shorten trailing shelf space. A responsive near-11:15 portrait moves in native flow, with independently authored five-fold/center-crease paper. One renderer adds an independent lightweight podcast scene and a physical NASA-cover board, revealed with complementary scissors. No Stripe shader, model or media copied. Preserve DOM controls, source attribution, image/reduced-motion fallback, no autoplay or scroll history writes, and the paper shop reveal.

User refinement, 2026-10-23: replace the generated poster with the supplied Apollo print (original file unchanged; matching CSS/texture-UV display crop omits the frame). Enlarge from 80 to 96svh desktop; mobile stays width-bounded. Widen unfold travel from 85% to 125% of viewport and add 180ms exponential settling, without delaying native text scrolling. The supplied Jupiter image replaces the paper-arch podcast background; it is atmospheric imagery, explicitly not evidence about the selected Mars episode. These sizes, timing and asset choices are project decisions, not measured Stripe constants. Asset authorship/licenses beyond the official podcast cover/audio remain unverified; user supplied them for the bootcamp demo.
