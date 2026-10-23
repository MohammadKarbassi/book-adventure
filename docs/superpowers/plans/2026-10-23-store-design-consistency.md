# Store and Interior Design Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Review and finish every non-adventure shopping/reading/listening surface against the existing warm paper-and-lantern identity, preserving functional behavior and passing the full regression suite.

**Architecture:** Refine existing shared components first, then integrate their conventions into Persian and foreign discovery/detail routes. Keep server data fetching, native links, local storage and global playback intact. Changes to the introductory hero, adventure shelf, adventure routes and folding-poster sequence are excluded.

**Tech Stack:** Existing Next.js16.4 App Router, React19, TypeScript, Tailwind4, shadcn/Base UI, motion, Vitest and Playwright; no new dependencies by default.

**Spec:** Latest user request in this chat; AGENTS.md, PRODUCT.md and DESIGN.md define the incumbent direction. This plan records proposed implementation decisions, not completed visual approval.

## Global Constraints

- Leave «سفر ماجراجویی شما», its rendering/routing, the opening hero and media-scroll choreography unchanged.
- Exact subscription teaser heading: «ماجراجویی پلاس: یک اشتراک برای ماجراجویی بدون مرز».
- Preserve Persian RTL, connected letterforms, Persian numbers, both themes and reduced-motion behavior.
- Use semantic theme tokens and existing shadcn controls; check for an available shadcn MCP before creating a component. Currently no shadcn MCP is exposed; record that limitation instead of claiming its audit passed.
- Read relevant bundled Next.js guides before implementation. Preserve server-only Open Library caching and stable demonstration prices; do not replace API failures with misleading success.
- Keep the full-width opaque `data-home-store-surface` wrapper above the fixed canvas.
- Before each completed-section commit: lint, typecheck, unit tests, webpack production build and relevant production E2E tests. Persian conventional commit messages; do not push without authorization.

## Review Focus

1. Modified clicks, keyboard navigation, canceled animations and Back must retain native link behavior.
2. Long Persian/English titles, missing covers and unavailable Open Library data must remain readable and recoverable.
3. Purchase/subscription failures and blocked storage must not display false success or grant access.
4. Mobile controls, sticky panels and the global player must not obscure content or cause horizontal overflow.
5. Reduced motion, dark theme and keyboard focus must work throughout discovery → purchase → library → reading/listening.

## Evidence and proposed direction

Confirmed in source: Persian cards use BookTravelLink and 3D tilt; ForeignBookCard uses a plain Link and vertical lift. Foreign detail uses static BookCover while Persian detail uses BookCover3D. Both card titles truncate after one line. Existing shadcn controls already cover navigation, forms, dialogs, tabs, empty states, filters and playback; wholesale replacement is unnecessary.

Proposed direction: books stay the visual objects; warm paper, editorial Persian headings, restrained amber actions and turquoise utility ink remain the identity. Use shallow physical motion on covers and quiet state transitions on controls, not animated walls of content. Match English binding direction without forcing English text into Persian typography. Preserve practical store density rather than making every page cinematic. Rendered review may reject a proposed cosmetic change when the incumbent is already better.

## Coverage register

Every row requires desktop/mobile visual inspection and its relevant interactions; “reviewed unchanged” is a valid recorded result when no material issue exists.

| Section | Primary source | Functional proof |
| --- | --- | --- |
| Store rows, categories, teaser panels | app/page.tsx; components/home; components/book | home, book-motion, foreign-teaser, home-store-surface specs |
| Category index/detail, search, audiobooks | app/categories; app/category; app/search; app/audiobooks; components/browse | browse, navigation.mobile specs |
| Persian detail, purchases, reviews, sharing | app/book; components/book-detail | book spec; book-detail unit tests |
| Foreign lists/detail/loading/error | app/foreign; components/foreign | foreign spec; foreign unit tests |
| Subscription teaser, plans, FAQ, activation | components/home/subscription-teaser; app/subscription; components/subscription | subscription spec; subscription-pricing, access unit tests |
| Library, favorites, empty/populated states | app/library; components/library | library spec; store-actions/storage unit tests |
| Podcast list/detail and global player | app/podcasts; components/podcasts; components/player | player spec; player-podcasts/progress unit tests |
| Reader and access notices | app/read; components/reader | reader spec; reader/access unit tests |
| Header, mobile menu, search command, footer, 404 | components/site; app/not-found | smoke, navigation.mobile specs |

### Task 1: Shared discovery and shop surfaces

**Files:** components/book/{book-card,book-travel-link,section-header,book-row}.tsx; components/browse/{book-grid,category-header,category-card}.tsx; components/home/{category-strip,subscription-teaser,foreign-teaser}.tsx; e2e/book-motion.spec.ts; new e2e/store-design.spec.ts.

**Interfaces:** Preserve BookSummary props and existing route URLs. Reuse BookTravelLink; if binding direction is introduced, expose an optional `binding: "start" | "end"` prop with the current Persian behavior as default.

- [ ] Capture representative current desktop/mobile store, browse and search states; record concrete problems before edits.
- [ ] Add failing browser assertions for exact subscription heading, readable long-title layout, keyboard cover feedback and no overflow at393px. Exercise modified clicks and reduced-motion immediate navigation using the existing motion spec.
- [ ] Refine shared type/spacing and cover treatment without adding new controls. Keep titles readable within a stable card rhythm and maintain rating/price hierarchy. Change the exact requested teaser heading; preserve real price/features.
- [ ] Run lint/typecheck/unit/build and home/browse/book-motion/foreign-teaser/store-surface regressions. Update HANDOFF with evidence and commit the finished discovery section.

### Task 2: Consistent Persian and foreign book interiors

**Files:** components/foreign/foreign-book-card.tsx; components/book-detail/book-cover-3d.tsx; app/{book/[id],foreign/[workId]}/page.tsx; components/{book-detail/purchase-card,foreign/foreign-purchase-card}.tsx; e2e/{book,foreign,book-motion}.spec.ts.

**Interfaces:** Keep ForeignBook and existing purchase/store actions unchanged. Generalize BookCover3D only where needed to accept a title/image with optional existing color and explicit binding direction; do not invent source cover colors or authentic scanned textures.

- [ ] Inspect detail hero, purchase, about/specifications/reviews and foreign source/disclosure at desktop/mobile, including long Latin text and absent cover.
- [ ] Add failing tests for foreign physical-link parity, correct left binding, reduced motion and missing-cover recovery. Retain purchase/favorite/Back tests and failure-path assertions.
- [ ] Integrate consistent cover motion and editorial purchase hierarchy; remove gratuitous duplicate entrances if rendered evidence shows they distract. Preserve sticky readability, native tabs, review forms and legal/source disclosure.
- [ ] Run all gates with book/foreign/motion specs. Record source-data limitations and commit this section.

### Task 3: Subscription, library and shell

**Files:** app/subscription/page.tsx; components/subscription; components/library; components/site; app/not-found.tsx; e2e/{subscription,library,navigation.mobile,smoke}.spec.ts.

**Interfaces:** No changes to access predicates, plan pricing, storage schema or URL conventions. Use existing Card/Empty/Dialog/Accordion/NavigationMenu/Sheet components and semantic theme variants.

- [ ] Inspect plans/active status/FAQ, empty and populated library, header/footer/search/menu/404 in both themes. Record each surface as unchanged or requiring a named fix.
- [ ] Add regressions for any discovered defects; verify dialog focus return, mobile keyboard/touch controls, storage denial and correct access after activation.
- [ ] Apply one bounded batch of material hierarchy, spacing, focus and responsive fixes, preserving factual plan claims and purchase simulation.
- [ ] Run all gates and relevant subscription/library/navigation/smoke specs. Update HANDOFF and commit this section.

### Task 4: Listening and reading completion

**Files:** components/podcasts; components/player; components/reader; app/podcasts; app/read; e2e/{player,reader}.spec.ts.

**Interfaces:** Keep global player track switching/resume/speed and reader pagination/access/storage APIs. Do not change home poster/podcast choreography or displayed media selection.

- [ ] Inspect podcast discovery/episode detail, open/closed player and sample/full reader on desktop/mobile, including keyboard and reduced motion.
- [ ] Add failing proofs for discovered defects; verify player does not obscure final actions and reader keeps its place across font/layout changes.
- [ ] Apply only evidence-backed consistency/functional fixes. A surface already meeting the brief is reviewed unchanged, not animated for its own sake.
- [ ] Run all gates and player/reader specs; document actual playback versus mocked-media test coverage, then commit the finished section.

### Task 5: Whole-site acceptance

**Files:** e2e/store-design.spec.ts; docs/HANDOFF.md; DESIGN.md only for intentional reusable additions actually shipped.

- [ ] Perform one batched visual review of all coverage-register rows at1440×900 and393×851, plus representative tablet/320px, dark and reduced-motion cases. Record screenshots and route/state coverage; do not label unvisited states approved.
- [ ] Fix material findings in one batch, then at most one visual confirmation round. Functional failures still require a reproducible fix and passing regression.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `OPENLIBRARY_FIXTURES=1 npm run build -- --webpack`, then the entire production Playwright suite at3100 with2workers. Never overlap build and typecheck.
- [ ] Review diff, triage hook findings individually, record counts/limitations and completed coverage in HANDOFF. Stop the agent-owned test server; leave the user's3000 process intact.
- [ ] Commit final acceptance documentation only after all required checks pass. Report what changed, what was reviewed unchanged and any external/live-data checks that remain unverified. No push/deployment implied.

## Execution and acceptance — 2026-10-23

User authorized continuation after shadcn connected and explicitly confirmed same-directory/separate-branch work. Completed on `codex/store-consistency`, without modifying adventure/shelf/media choreography.

| Task | Outcome |
| --- | --- |
| 1: discovery | Two-line shared card rhythm, native-safe physical motion preserved, exact Plus heading; no unnecessary new controls. |
| 2: details | Foreign cards and detail share physical-book conventions with left binding; optional color/null-image type support uses the existing titled fallback. Clone direction regression fixed after independent review. |
| 3: subscription/library/shell | Subscription/library flows retained after review. Fixed proven tablet/intermediate-header overflow using coherent navigation/search breakpoints, not overflow masking. |
| 4: listening/reading | Podcast, player/phone Sheet and reader reviewed unchanged; existing interaction/access/resume tests pass. External media availability is not claimed from mocked tests. |
| 5: acceptance | Fourteen route templates captured desktop/phone;14routes×3widths×2themes checked with reduced motion and no runtime errors/overflow. Independent code review completed;227 unit tests, lint/typecheck,229-page webpack build and110 production E2E tests passed after the last fix. |

Execution adjustment: tasks1/2 form one shared-capability commit because binding direction crosses card and detail. Existing coherent pages were reviewed unchanged rather than cosmetically rewritten. No blanket design ignores: one file/value exception preserves existing neutral cover lighting. Detailed evidence, earlier failed runs and limits are in docs/HANDOFF.md. Checklist steps above remain the proposed workflow, not fabricated individual test claims (missing-cover handling was source-reviewed; live API outage was not fault-injected). No push/merge/deployment authorized.
