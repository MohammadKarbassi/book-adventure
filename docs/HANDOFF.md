# Handoff — «ماجراجویی با کتاب» (Book Adventure)

For the next coding agent (Codex or Claude Code). Read `AGENTS.md` first (`CLAUDE.md` is a symlink to it): it holds the bootcamp rules, requirements, data decisions and grading criteria, in Persian. This file is the operational snapshot: what exists, what is in progress, how to run and verify, and the traps already found.

Last updated: 2026-10-22 (۳۰ مهر ۱۴۰۵). Deadline: Friday 2026-10-23 (۱ آبان ۱۴۰۵). Deliverables: GitHub repo link, live Vercel link, demo video.

## 1. Snapshot

- Intro timing/refinement (2026-10-22): removed the rotating cover halves (which produced gray panels across the home page); exit is one 900 ms full-overlay crossfade. Audio starts at the offset elapsed since intro start and has a hard scheduled end at 4.7 seconds; early exit fades it over the same 900 ms. Music defaults enabled; explicit mute is persisted in `book-adventure:v1:introMusicMuted`. When autoplay is blocked, the enabled control says «فعال‌کردن صدا». Reduced motion still skips the intro and audio.

- Music revision (2026-10-22): replaced the synthesized oscillator sting with a locally hosted 4.7-second orchestral recording excerpt, “Adventures in Adventureland” by Kevin MacLeod, CC BY 4.0. Asset: `public/audio/adventure-intro.mp3` (~96 KB); source/edit/license details: `public/audio/README.md`. Visible attribution links are in the intro. Web Audio decodes the recording, and exit fades gain before closing the context. This supersedes the original synthesized score described below.

- Intro update (2026-10-22): the session marker now stores `performance.timeOrigin`; reopening or reloading the home page replays the intro, while client navigation in the same document does not. An original local Web Audio adventure sting accompanies it, with a shadcn Button sound toggle. Autoplay is attempted; browsers that block it require pressing «پخش موسیقی». Exit/unmount closes the audio context; reduced motion skips both animation and music. Verified: lint, typecheck, 216 unit tests, production build with `next build --webpack`, and 9 intro Playwright tests. Default Turbopack build hit an environment port-binding restriction; Webpack succeeded.

- Repo: https://github.com/MohammadKarbassi/book-adventure (public), branch `master`, remote `origin`.
- Vercel: imported by the owner; live URL not known yet (see §4.1). Every push to `master` should deploy.
- Pushed: everything is on `origin/master`, including the adventures redesign (`0c29f9c`).
- Last full verification (2026-10-22, main checkout, production build): lint, typecheck, Prettier, 215 unit tests, `next build` (229 static pages, no warnings) and Playwright 72/72 (desktop + mobile), twice in a row.

## 2. What is built (all committed)

| Area                                                                                                            | Route(s)                                                    | Main files                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Cinematic intro (every visit to `/`, once per tab via sessionStorage)                                           | `/`                                                         | `components/intro/*`, pre-paint script in `app/layout.tsx`, rule in `app/globals.css`   |
| Home: Stripe Press–style 3D shelf + store sections                                                              | `/`                                                         | `app/page.tsx`, `components/home/*`                                                     |
| Book page: cover-tinted band, sticky 3D cover, purchase dialog, favorites, reviews + review form, similar books | `/book/[id]`                                                | `app/book/[id]/page.tsx`, `components/book-detail/*`                                    |
| Categories (filters/sort/pagination in the URL), category index, search, audiobooks                             | `/category/[slug]`, `/categories`, `/search`, `/audiobooks` | `lib/browse.ts`, `components/browse/*`                                                  |
| Reader with a 3D page turn (RTL, sample limit, progress)                                                        | `/read/[id]`                                                | `components/reader/*`, `lib/reader.ts`, `data/sample-text.ts` (Golestan, public domain) |
| Global audio player (persists across navigation) + podcasts                                                     | `/podcasts`, `/podcasts/[id]`                               | `components/player/*`, `components/podcasts/*`                                          |
| Subscription and library                                                                                        | `/subscription`, `/library`                                 | `components/subscription/*`, `components/library/*`, `lib/plans.ts`                     |
| Foreign books from the Open Library API                                                                         | `/foreign`, `/foreign/[workId]`                             | `lib/openlibrary.ts` (server), `lib/foreign.ts` (pure), `components/foreign/*`          |
| Shell: header (category menu, ⌘K search, library, theme), footer, 404                                           | —                                                           | `components/site/*`, `app/not-found.tsx`                                                |

Docs: `README.md` (Persian, for graders; does not yet mention the adventures page or foreign books in detail — update it), `docs/demo-script.md` (step-by-step script for the demo video; add the adventures page).

## 3. «مسیر ماجراجویی» (done, committed in `0c29f9c`)

The home shelf and the per-book inner pages reproduce the press.stripe.com experience the owner asked for. Spec: `AGENTS.md` → «نیازهای پروژه» item 2.

- Shelf (`components/home/*`, `components/book/book-spine.tsx`): 14 adventures from `lib/adventures.ts` (copy `data/adventures.ts`, palettes `data/palettes.json`). Spines show the cover art wrapping around with an embossed title, cloth texture, «ماجراجویی n» and the site mark. Hover/focus on any book tips it forward to show the cover. Heading «سفر ماجراجویی شما», eyebrow «کتاب‌های انتخاب شده برای سفرتان». Links go to `/adventures/<bookId>`.
- Personalized order (`components/adventures/journey-order.ts`, `use-journey-order.ts`): weights purchases 3, favorites 2, started books 1 by category; server renders the default order, the client reorders after hydration and shows «بر اساس علاقه‌مندی‌های شما» only when something matched. Numbers follow the displayed order.
- `/adventures/[bookId]` (`components/adventures/*`): one continuous immersive page (site header/footer hidden by a CSS rule in `app/globals.css`); each adventure is a full-color room from its palette with a hard seam and its own ink (`room-colors.ts`, contrast unit-tested); draggable six-faced 3D book (`adventure-book-3d.tsx`) with inertia, spring-back and keyboard rotation; fixed rail with one tick per adventure and a «؟» popover; URL follows the active section via `history.replaceState`; «همسفران» reviews in a 3-column Praise-style grid.
- Reference frames from the owner's Stripe recording (local only, not in the repo; do not copy Stripe assets): `/private/tmp/claude-501/-Users-mohammad-Developer-AI-Engineering-Bootcamp-ebook-platform/b7b5f581-eacd-4d75-ac9e-0f04bec7d79c/scratchpad/rec/r_01.jpg` … `r_04.jpg`.

## 4. Remaining work, in order

1. Vercel: the owner imported the repo (2026-10-22) but the live URL is unknown — `book-adventure.vercel.app` and similar guesses return 404, and GitHub shows no deployment statuses. Get the URL from the Vercel project's Domains section; if the deployment failed, read its Build Logs and fix. Then on the live site check that Fidibo covers, `/foreign` (live Open Library API), audio samples and podcast audio load, and that the adventures page drags smoothly.
2. Update `README.md` (adventures page, foreign books, live link) and `docs/demo-script.md` (add: shelf hover and personalized order, open an adventure, drag the book through all faces, scroll across room seams, rail ticks). Commit and push.
3. Optional polish: persist the reader's theme and font size; animate full-height section reordering on the adventures page (currently only the shelf and rail animate).

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
