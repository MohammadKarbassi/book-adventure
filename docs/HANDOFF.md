# Handoff — «ماجراجویی با کتاب» (Book Adventure)

For the next coding agent (Codex or Claude Code). Read `AGENTS.md` first (`CLAUDE.md` is a symlink to it): it holds the bootcamp rules, requirements, data decisions and grading criteria, in Persian. This file is the operational snapshot: what exists, what is in progress, how to run and verify, and the traps already found.

Last updated: 2026-10-22 (۳۰ مهر ۱۴۰۵). Deadline: Friday 2026-10-23 (۱ آبان ۱۴۰۵). Deliverables: GitHub repo link, live Vercel link, demo video.

## 1. Snapshot

- Repo: https://github.com/MohammadKarbassi/book-adventure (public), branch `master`, remote `origin`.
- Vercel: the owner imports the repo in vercel.com; every push to `master` then deploys. Not confirmed yet whether the import was done.
- Pushed: `origin/master` is at `b1f98ea` (README and demo script). Every later commit (adventures data, foreign books, Codex review fixes, the Open Library fixture-path fix, this handoff) is **committed locally but not pushed** on purpose: it is pushed together with the adventures redesign once the whole suite passes on a production build (see §4). `git log --oneline origin/master..HEAD` lists them.
- Last full verification of the committed tree (temporary worktree, production build): lint, typecheck, 203 unit tests and `next build` green; Playwright 58/60. The 2 failures are in `e2e/intro.spec.ts`: they expect the new home heading «سفر ماجراجویی شما», which only exists in the uncommitted adventures work. They pass once that work is committed.

## 2. What is built (all committed)

| Area                                                                                                            | Route(s)                                                    | Main files                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Cinematic intro (first visit to `/` only)                                                                       | `/`                                                         | `components/intro/*`, pre-paint script in `app/layout.tsx`, rule in `app/globals.css`   |
| Home: Stripe Press–style 3D shelf + store sections                                                              | `/`                                                         | `app/page.tsx`, `components/home/*`                                                     |
| Book page: cover-tinted band, sticky 3D cover, purchase dialog, favorites, reviews + review form, similar books | `/book/[id]`                                                | `app/book/[id]/page.tsx`, `components/book-detail/*`                                    |
| Categories (filters/sort/pagination in the URL), category index, search, audiobooks                             | `/category/[slug]`, `/categories`, `/search`, `/audiobooks` | `lib/browse.ts`, `components/browse/*`                                                  |
| Reader with a 3D page turn (RTL, sample limit, progress)                                                        | `/read/[id]`                                                | `components/reader/*`, `lib/reader.ts`, `data/sample-text.ts` (Golestan, public domain) |
| Global audio player (persists across navigation) + podcasts                                                     | `/podcasts`, `/podcasts/[id]`                               | `components/player/*`, `components/podcasts/*`                                          |
| Subscription and library                                                                                        | `/subscription`, `/library`                                 | `components/subscription/*`, `components/library/*`, `lib/plans.ts`                     |
| Foreign books from the Open Library API                                                                         | `/foreign`, `/foreign/[workId]`                             | `lib/openlibrary.ts` (server), `lib/foreign.ts` (pure), `components/foreign/*`          |
| Shell: header (category menu, ⌘K search, library, theme), footer, 404                                           | —                                                           | `components/site/*`, `app/not-found.tsx`                                                |

Docs: `README.md` (Persian, for graders; does not yet mention the adventures page or foreign books in detail — update it), `docs/demo-script.md` (step-by-step script for the demo video; add the adventures page).

## 3. In progress: «مسیر ماجراجویی» redesign (uncommitted)

The owner wants the home shelf and the per-book inner pages to deliver the press.stripe.com experience. Spec: `AGENTS.md` → «نیازهای پروژه» item 2 (paragraphs «مسیر ماجراجویی» and the Stripe Press details). In short:

- Shelf (`components/home/*`): 14 adventures from `lib/adventures.ts` (copy in `data/adventures.ts`, palettes in `data/palettes.json`, both committed). Spine shows the cover artwork wrapping around it with an embossed title, cloth texture and the site mark (`components/book/book-spine.tsx`). Hover/focus on ANY book (top or bottom) tilts it forward to reveal part of the cover. Heading «سفر ماجراجویی شما», eyebrow «کتاب‌های انتخاب شده برای سفرتان». Shelf books link to `/adventures/<bookId>`.
- Personalized order: a pure helper (`components/adventures/journey-order.ts`) scores adventures by the categories of the user's favorites, purchases and reader-progress books; server renders the default order, the client reorders after hydration with a layout animation and shows «بر اساس علاقه‌مندی‌های شما» only when there are signals. Numbers «ماجراجویی n از ۱۴» follow the displayed order; routes use the stable book id.
- `/adventures/[bookId]`: one continuous page with all adventures. Must match the Stripe Press recording the owner sent:
  1. A draggable six-faced 3D book (front cover, back cover, spine on the RIGHT for Persian binding, page block, top/bottom edges) that spins 360° with pointer/touch drag, has inertia, and springs back to a 3/4 angle; keyboard arrows rotate it; reduced motion disables inertia.
  2. Each adventure is a full-color "room" from its palette with a crisp horizontal seam to the next; ink color adapts per room (contrast-tested).
  3. Immersive: site header/footer hidden; only the site mark, the side rail (back to shelf, one tick per adventure, audio/podcast icons) and a «؟» help popover.
  4. The book is sticky within its section and is replaced by the next section's book.
  5. Content: adventure name, «بر اساس …» line, short rule, story, route (three stops), trip facts, gear, a bordered purchase table with ↗ cells, and «همسفران» reviews styled like Stripe's "Praise" (3 columns).
- Reference frames from the owner's recording (local machine only, not in the repo; Stripe's assets must not be copied into the project): `/private/tmp/claude-501/-Users-mohammad-Developer-AI-Engineering-Bootcamp-ebook-platform/b7b5f581-eacd-4d75-ac9e-0f04bec7d79c/scratchpad/rec/r_01.jpg` … `r_04.jpg`, and screenshots `…/images/1.webp` … `12.webp` in the same session folder.
- Uncommitted files at handoff time: `app/adventures/**`, `components/adventures/**`, `components/book/book-spine.tsx`, `components/ui/popover.tsx` (added via shadcn), `components/home/{book-shelf,shelf-book,shelf-books,shelf-geometry}.tsx|ts`, `app/page.tsx`, `app/book/[id]/page.tsx` (small «ماجراجویی n» link), `app/globals.css`, `e2e/adventures.spec.ts`, `e2e/home.spec.ts`, `tests/unit/adventures.test.ts`, `tests/unit/home-shelf.test.ts`. A Claude coder agent was still working on them; check `git status` and the dev server before assuming anything is finished.

Definition of done for this section: the owner's points above are visibly true in a real browser (drag the book, look at a seam between two rooms, light and dark site theme), no console/hydration errors, `e2e/adventures.spec.ts` + `e2e/home.spec.ts` + `e2e/intro.spec.ts` green, then one commit.

## 4. Remaining work, in order

1. Finish and verify the adventures redesign (§3), commit it.
2. Full verification on a production build: `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e` (desktop + mobile projects). Fix anything red.
3. Push `master`. Ask the owner to confirm the Vercel import; open the live site and check that Fidibo covers, Open Library pages and audio samples load in production.
4. Update `README.md` (adventures, foreign books, live link) and `docs/demo-script.md` (add the adventures page: drag the book, scroll across rooms, rail). Commit and push.
5. Optional polish if time allows: persist the reader's theme/font size; a shared «ماجراجویی n» entry on book pages already exists for adventure books.

## 5. Run, test, data

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # Vitest unit tests (tests/unit)
npm run test:e2e       # Playwright: builds and starts production on :3100 (desktop 1440×900 + mobile Pixel 7)
E2E_BASE_URL=http://localhost:3000 npx playwright test e2e/<spec>.ts --project=desktop   # against a running server
npm run data:fidibo    # refetch the Fidibo catalog via the unofficial fidibo-mcp (needs `uv`); slow, rate-limited
npm run data:podcasts  # refetch podcasts (iTunes Search + RSS) and audio samples (Internet Archive)
npm run data:palettes  # recompute cover palettes from .cache/covers
```

Never run two `next build`s or Playwright production runs at the same time in the same checkout (they share `.next`). To verify the committed tree while files are being edited, use a temporary worktree with a cloned `node_modules` (`git worktree add <dir> HEAD && cp -cR node_modules <dir>/`); a symlinked `node_modules` does not work with Turbopack.

## 6. Architecture and conventions

- **Data is static JSON** in `data/` (catalog 112 books, podcasts, audio samples, adventures, palettes). `lib/catalog.ts` and `lib/adventures.ts` are server-only (the catalog JSON is ~650 KB): client components receive slim, serializable props (`BookSummary` via `toSummary`). Never import them from a `"use client"` file.
- **User state lives in localStorage** under `book-adventure:v1:*` (`lib/storage.ts` → `lib/store-actions.ts` → hooks in `lib/store.ts`, keys in `lib/store-core.ts`). Hooks use `useSyncExternalStore`: defaults on the server and during hydration, real values right after. Every write can fail; hooks return `false`/`null` and callers show `toastSaveError` (`components/site/save-error.ts`) instead of success.
- **Access rule** (`lib/access.ts`): free OR purchased OR (in subscription AND subscription active).
- **shadcn/ui on Base UI**: components in `components/ui` use a `render` prop, not `asChild`. For a link that looks like a button use `<Link className={buttonVariants(...)}>`; `<Button nativeButton={false} render={<Link/>}>` exposes the link as `role="button"` (this was fixed across the app — don't reintroduce it). Add components with `npx shadcn add <name>` and check the shadcn MCP first (rule in `AGENTS.md`).
- **Design tokens only** («کاغذ و فانوس» theme in `app/globals.css`); raw colors are allowed only for a book's own cover colors/palettes and black/white lighting overlays. `font-heading` is Markazi Text, body is Vazirmatn.
- **RTL**: logical classes only (`ms/me/ps/pe/start/end/text-start`). Persian books bind on the right (spine = inline-start); the reader turns pages right→left.
- **Persian numbers** everywhere via `lib/format.ts` (`formatPrice`, `formatNumber`, `formatDuration`, `formatClock`, `formatDate`).
- **Images**: `images.unoptimized` is on (see `next.config.ts`): Fidibo's CDN rejects non-browser fetchers, and some local proxies resolve it to a private IP that the Next optimizer refuses.
- **Open Library**: fetched only on the server with a project User-Agent (repo URL, no personal email), `revalidate: 86400`, 8 s timeout; `/foreign` routes are dynamic so an outage is never cached as a page. `OPENLIBRARY_FIXTURES=1` (set by the Playwright production webServer) reads `e2e/fixtures/openlibrary/*` instead of the network. Keep that path a literal so the build doesn't trace the whole project.
- **Tests**: Playwright specs import `test`/`expect`/`clearStore` from `e2e/fixtures.ts`, which marks the intro as seen and answers external image hosts with a local 1×1 PNG. `e2e/intro.spec.ts` deliberately uses `@playwright/test` directly. Audio in e2e is routed to `e2e/assets/silence.mp3`.

## 7. Known traps

- On the dev server, CSS arrives through JS shortly after `load`, so "no horizontal scroll" checks in `e2e/navigation.mobile.spec.ts` can flake on dev. They pass on production; judge them there.
- Generated route types in `.next/types` can be stale after adding routes; `npx next typegen` refreshes them without a build.
- Next 16 `notFound()` after a `loading.tsx` boundary has started streaming returns status 200 with `noindex` (documented). `/foreign/[workId]/layout.tsx` validates the id first so malformed ids return a real 404.
- Fidibo descriptions sometimes contain Latin digits; `lib/catalog.ts` converts titles to Persian digits and `normalizePersian` maps digits both ways for search.
- Five audio samples are CC BY-NC(-ND/-SA); the player must keep showing attribution and license (it does, via the info tooltip).
- Content rules: adventures avoid sensitive topics (suicide, self-harm, abuse, terminal illness). Do not copy Stripe Press images or text (copyright); recreate the feel with our own data.
