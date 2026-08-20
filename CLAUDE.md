# Tastemakers Web — Claude Code Context

## Current status

<!-- now-tldr -->
Next.js 15 + TypeScript frontend for Tastemakers. The public app lives in the `(app)` route group on the **v2 light design system** (purple `#2A1A5E` / crimson `#C7255B` on a `#F1F1F3` canvas, Playfair Display headings + Roboto body) — home, search, cuisines, lists, restaurant detail, photos, bookmarks, profile, auth. Admin panel is separate, with its own Paper/Gruvbox themes and Supabase Google OAuth. Code is organised into **feature modules** under `src/features/` — each owns its queries, components and stylesheet. Data is read **directly from Supabase**, not through the Laravel API (see TODO-089). 486 tests green. Deployed live on Railway at **`www.tastemakersapp.com`** and the apex `tastemakersapp.com`. **`app.tastemakersapp.com` was retired 2026-08-18 — do not reintroduce it**; Railway's Hobby plan caps custom domains at 2 per service, and both are in use. (An earlier version of this line named `app.` as the live host, contradicting the Deployment section further down.)
<!-- /now-tldr -->

<!-- DOCS:STATUS:START -->

## Current focus

_Generated 2026-08-20 by `npm run docs:refresh` — do not edit between these markers._

**Now:** RM-01 Finish the hosting migration · RM-02 Fix the P1 security backlog · RM-13 PostgreSQL compatibility sweep

**Next 3 to-dos:**

1. **TASK-24** (p2) — Retire the `/v2/api` iOS shim (`tastemakers-web/next.config.ts`). **Blocked on two things:** the iOS build that moves `NetworkManager.swift:14` off the legacy prefix must ship AND drain, and shim usage must be instrumented — the stated gate ("iOS adoption > 90%") currently has no instrument behind it, since PostHog is browser-only and never sees a `URLSession` call. Removal condition: `/v2/api/*` under 10 requests/day for 30 consecutive days.
2. **TASK-20** (p1) — Photo upload is off. `restaurant-image-save` writes to `public_path('storage/res_image')` — Railway's filesystem is ephemeral, so uploads vanish on restart. Needs object storage. **Also why every legacy profile image 404s.** **CORRECTED 2026-08-19:** the ephemeral disk is real but SECONDARY — the endpoint 500s on its first statement, because `logAdd` wrote four column names `api_logs` does not have. Fixed in backend PR #38, so uploads now reach the filesystem and *then* hit this. Validation was also absent (`"image" => ""`); now mimes + size limited. What remains here is genuinely the storage.
3. **TASK-21** (p1) — Foursquare credentials unset, so `/api/restaurants` returns `status:false` for every caller — including the iOS app just reconnected by the /v2/api shim. Legacy V3 deprecated 2026-05-15 and V2 Pro is now priced, so this is a vendor/cost decision. Backend todo 073. **DECIDED 2026-08-20 — migrate to Google Places** (James). Scoped in backend todos 076/077; no code written. **Call-site count corrected: 6, not 12** — the higher figure counted `config('services.foursquare.timeout')` lines. `GooglePlacesService` already covers 2 of the 3 operations and is already on the new Places API; only pagination is missing. **Blocker the scope found:** 1,385 of 1,388 rows carry Foursquare `place_id`s, and a 24-hex id passes Google's format check, so a straight swap 404s detail lookups for 99.8% of the catalogue *silently*. Tractable because `restaurantDetails` only echoes back the id it was given and reads the rest from our own DB — serving it locally removes 2 of the 6 sites with no vendor dependency.

→ Full roadmap: [`docs/product/roadmap.md`](docs/product/roadmap.md)

<!-- DOCS:STATUS:END -->

## Project Overview
Web frontend for the Tastemakers restaurant discovery platform. Built with Next.js 15 and TypeScript. This is a new project being built to bring the Tastemakers experience to the browser.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v3 (installed, `tailwind.config.ts`)
- **State:** React Server Components + client hooks
- **API:** None. This app does **not** call Laravel — every data path goes to
  Supabase directly (see "Data layer" below, TODO-089). A fallback rewrite to
  `http://localhost:4050` was removed 2026-08-18: that host does not exist in
  production, so unmatched `/api/*` returned **500**, not 404. Every `/api/*`
  path the client fetches is a route handler in `src/app/api`;
  `src/lib/api-routes.test.ts` fails if one is added without a handler, or if
  the proxy is reinstated.
- **Dev Server Port:** 3050

## Setup
```bash
npm install
npm run dev        # starts on port 3050
npm run build      # production build
npm run type-check # TypeScript validation
npx vitest run     # run 486 tests (43 test files)
```

## Project Structure
```
tastemakers-web/
├── src/
│   ├── middleware.ts          Auth gate for /admin/* (CRITICAL: must be in src/, not root)
│   ├── app/                   Next.js App Router pages
│   │   ├── layout.tsx         Root layout (JetBrains Mono + Roboto fonts)
│   │   ├── globals.css        Global CSS — admin themes + public .pub-card/.pub-nav-link
│   │   ├── robots.ts          → /robots.txt (disallow /admin, /api)
│   │   ├── sitemap.ts         → /sitemap.xml (dynamic from lib/api)
│   │   ├── auth/callback/     PKCE OAuth code exchange route (Supabase Google OAuth)
│   │   ├── (public)/          PUBLIC route group (SEO pages — no auth required)
│   │   │   ├── layout.tsx          Public layout: sticky header + footer (purple/pink brand)
│   │   │   ├── tastemakers/page.tsx         → /tastemakers  (grid of tastemakers)
│   │   │   ├── tastemakers/[slug]/page.tsx  → /tastemakers/:slug (profile + JSON-LD)
│   │   │   ├── lists/[slug]/page.tsx        → /lists/:slug  (coming next)
│   │   │   └── restaurants/[id]/page.tsx    → /restaurants/:id (coming next)
│   │   └── admin/             Terminal/DevTool admin (Paper + Gruvbox themes)
│   │       ├── layout.tsx          Chrome: command bar, sidebar, status footer, ⌘K palette
│   │       ├── page.tsx            Live dashboard — KPIs, platforms, trends, trending cities, web stats, activity feed
│   │       ├── login/page.tsx      Supabase OAuth (Google) login
│   │       ├── users/page.tsx      User table with filter chips
│   │       ├── platforms/[id]/     Per-platform: stats, todos, commits, routes
│   │       ├── roadmap/page.tsx    Platform-grouped macro milestones (backend/ios/android/web/marketing)
│   │       ├── todo/page.tsx       Detailed implementation tasks, filterable by platform/priority/status
│   │       ├── changelog/page.tsx  Versioned changelog with + / ~ / - diff style
│   │       ├── routes/page.tsx     API route table with method/auth filters
│   │       ├── errors/page.tsx     Error log with severity filters
│   │       ├── analytics/page.tsx  PostHog / GA / Search Console — live links + event counts
│   │       ├── status/page.tsx     Live health checks for all services
│   │       ├── docs/page.tsx       Documentation index — registry-driven, 13 docs, 5 categories
│   │       └── docs/[id]/page.tsx  Individual doc viewer (local + GitHub sources)
│   ├── content/
│   │   └── docs/              Local markdown docs (6 files)
│   │       ├── going-live.md      Going-live runbook (merged in blockers.md)
│   │       ├── cross-todos.md     Cross-project todos snapshot
│   │       ├── operations.md      Deploy/rollback/incident runbook + env inventory
│   │       ├── architecture.md    System architecture map
│   │       ├── metrics.md         KPI definitions
│   │       └── root-claude.md     Root CLAUDE.md snapshot
│   ├── components/            Shared React components (JsonLd.tsx)
│   ├── hooks/
│   ├── lib/
│   │   ├── api/               PUBLIC DATA LAYER — reads Supabase directly (TODO-089)
│   │   │   ├── types.ts           Tastemaker, CuratedList, Restaurant, Tag
│   │   │   ├── index.ts           getTastemaker, listTastemakers — NOT a stub, NOT Laravel
│   │   │   └── shared.ts          fetchAllPages, buildTagsByRestaurant, tasteLevel, cityFromAddress
│   │   ├── admin-filters.ts   filterTodos() + summarizeRoadmap() — shared by admin roadmap + todo pages
│   │   ├── auth.ts            Pure fns: parseAllowedEmails, isEmailAllowed, resolveCallbackOrigin (middleware)
│   │   ├── docs.ts            DOCS_REGISTRY (13 entries), fetchMarkdown() via GitHub Contents API (needs GITHUB_TOKEN for private repos), fetchDocUpdated()
│   │   ├── markdown.ts        renderMarkdown() — default marked renderer (custom renderers broke on marked v13+ token API); styling via .md-body CSS
│   │   ├── github.ts          fetchCommits() — GitHub API wrapper (used by platforms page)
│   │   ├── posthog.ts         posthogQuery() shared HogQL client — used by analytics + dashboard
│   │   ├── trends.ts          12-week KPI trend data (users/restaurants/tags/saves)
│   │   ├── city-stats.ts      30d trending-cities leaderboard with week-over-week deltas
│   │   ├── activity-feed.ts   Merged activity feed (signups/tags/lists)
│   │   ├── supabase.ts        Supabase client factory (SSR-safe)
│   │   └── validation.ts      Form validation helpers (email, password, required)
│   └── types/
│       └── index.ts           TypeScript interfaces matching API models
├── public/                    Static assets
├── next.config.ts             redirects (legacy iOS paths) + /v2/api iOS shim rewrite + images. NO /api proxy.
├── vitest.config.ts           Vitest config — @/ alias, node environment
├── tsconfig.json              TypeScript config (strict, path aliases)
├── tailwind.config.ts         Tailwind CSS config
├── package.json               Dependencies and scripts
├── .env.local.example         Environment variable template
└── CLAUDE.md                  This file
```

## Design System — v2 (light)

The `(app)` route group uses the v2 system. Tokens are scoped to `.tm-app` in
`src/styles/tokens.css`, **not** `:root` — `--tm-ink` and `--tm-muted` also belong to the
admin Paper/Gruvbox themes, and redefining them globally breaks the admin light/dark toggle.

| Token | Hex | Usage |
|-------|-----|-------|
| `--tm-purple` | `#2A1A5E` | Top bar, tab bar, headings |
| `--tm-tag` | `#3D2A75` | Tag chip fill |
| `--tm-tag-light` | `#7C67B8` | A tag you added |
| `--tm-crimson` | `#C7255B` | Every primary action |
| `--tm-canvas` | `#F1F1F3` | Page background |
| `--tm-card` | `#FFFFFF` | Cards |
| `--tm-ink` / `--tm-muted` / `--tm-faint` | `#1D1730` / `#98939F` / `#B4AFBD` | Text scale |

- **Type:** Playfair Display (700/800/900) for headings, Roboto (400/500/700) for everything
  else. Buttons are uppercase Roboto 700, `letter-spacing: .09em`.
- **Shape:** tags 4px radius (**not pills**), cards 8px, controls 6px.
- **Tags show no numbers.** Strength is the fill, the size and the order — deliberate, per
  the design spec. Do not "improve" it by adding counts.
- **Nav:** bottom tab bar under 768px, top bar at 768+. No sidebar, no drawer, no icon rail.
- **Image domains:** `images.unsplash.com` (placeholders), `*.foursquare.com`,
  `fastly.4sqi.net`, and `api.tastemakersapp.com/storage/**` (user photos).
- **Import note:** import feature data from `@/features/<name>/api`. `src/lib/api.ts` used
  to shadow this and is now deleted (see "Removed 2026-08-19").

### Tag levels are PERCENTAGE-based, and deliberately diverge from iOS

**The model (James, 2026-08-20):** levels depend on the total number of voted tags, so with
few voters or few votes the scale *adjusts*. It is proportional, not a fixed threshold and
not a subtraction.

`assignTagLevels` and `levelFor` in `src/features/tags/levels.ts` level each tag by its
**share of that restaurant's leading tag** — quintiles of the leader: `≥.8 → L1`, `≥.6 → L2`,
`≥.4 → L3`, `≥.2 → L4`, else L5. Always relative to the tag's *own* restaurant, never a
global maximum.

**This used to be a port of iOS `Utils.calcucateTagLevels`** (`Utils.swift:334`), which is a
*gap*: `gap<1 → L1, ==1 → L2, ==2 → L3, ==3 → L4, else L5`. A subtraction only behaves while
counts stay in the 1–5 range iOS was written around. It degenerates exactly when voting
recovers and ranking starts to matter:

| votes | gap (iOS) | share (web) |
|---|---|---|
| 50, 47, 30, 12, 4 | L1, **L4, L5, L5, L5** | L1, L1, L2, L4, L5 |

At a leader of 50, anything under 47 votes is L5 — three of five levels collapse.

**Web and iOS now rank differently, on purpose.** That is the same divergence the port was
introduced to remove, so treat it as a known, accepted state — not as the old
`voteCountToLevel` bug reappearing. Do **not** "restore parity" by reverting; raise it. It
resolves when an iOS release carries the proportional rule, and old installs keep the gap
rule for months after that.

Changed while **every one of the 4,230 (restaurant, tag) pairs in production had exactly one
vote** (verified 2026-08-20), so nothing visibly moved. Doing it after the vote data spreads
would have shifted rankings under users.

**Production caveat:** that same flatness — a legacy `UNIQUE (restaurant_id, tag_id)` capped
every count at 1 — means every restaurant tag still renders L1. The ramp is correct; the data
has no spread. The one surface with a real spread is the "Known for" cloud on a tastemaker
profile, which levels by how often *that person* used each tag. See TASK-01 and TASK-18.

`levelForGap` is retained in `levels.ts` as the historical rule, referenced only by the tests
that assert this divergence.

## Feature modules

Each feature under `src/features/` owns its own queries (`api.ts`), components and
stylesheet. Shared helpers live in `src/lib/api/shared.ts` — **no feature imports another
feature's data layer.**

```
src/features/
  shell/       AppShell · AppNav · CityPicker · Logo · nav-items · shell.css
  tags/        TagChip · RankedTagChip · RankedTagCloud · TagEditor · levels · ramp · vocabulary
  restaurants/ api · ResultCard · PhotoCarousel · PhotoGrid · RestaurantDetailView
  search/      api · query
  home/        api · PitchBand
  lists/       api · ListCard
  cuisines/    api
  profile/     useMe · SignedOutPrompt
  email/       subscribe · EmailSignup
  auth/        auth.css
```

A component owns its stylesheet — `ResultCard.tsx` imports `result-card.css`. A hand-written
CSS import in each consumer is forgettable, and a forgotten one renders unstyled rather than
erroring. `src/styles/css-wiring.test.ts` fails the build when a `tm-*` class is used but
never defined, or a stylesheet exists but is never imported.

## URLs

Restaurant and list slugs are **name-plus-id** (`langers-delicatessen-159`). Name alone is not
unique: 68 slugs are shared across the 1,388 restaurants (14 are In-N-Out Burger) and 34 names
are non-Latin. Old numeric URLs still resolve and `rel=canonical` points at the slug form.

## Server rendering — do not regress this

**Never wrap `{children}` in a Suspense boundary that also contains a `useSearchParams`
consumer.** That hook makes Next bail its closest boundary out of server rendering on
statically generated pages; when the boundary held the whole app, every page reached crawlers
with no `<h1>`, no tags and no content — while build, typecheck, tests and screenshots all
stayed green. See `docs/solutions/rendering-issues/` (SOL-005).

Verify with `curl "$URL" | grep -c '<h1'`, not with a screenshot. `scripts/audit-screens.mjs`
asserts this across every route.

## Auth Architecture

- **Public pages** (`(app)/`): No auth. Server components fetch data directly. `(public)/` now holds only `/privacy` and `/tastemakers`.
- **Admin pages** (`/admin/*`): Gated by Supabase session via `src/middleware.ts`. Redirect to `/admin/login` if unauthenticated.
- **Public users**: Do not exist yet — read-only discovery only in this phase.
- **Supabase env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client + server), `SUPABASE_SERVICE_ROLE_KEY` (server-only).

## Data layer — reads Supabase directly

Each feature's `api.ts` calls `createServerClient()` and queries Supabase **directly**. The
Laravel API is not in the path. `apiFetch()` used to exist in two places, called by
nothing except its own tests; both were deleted (see "Removed 2026-08-19").

This is **TODO-089**, a known architectural divergence, not an oversight to "fix" casually:
- The web app and the iOS/Android clients read the same database through entirely different
  code, so a schema change breaks web without touching the API contract mobile depends on.
- The tag-ranking rule now exists in four places.
- Upside: the Laravel API being down does not take the website down.

The only live use of `NEXT_PUBLIC_API_URL` is `restaurantImageUrl()`, which builds photo URLs
against the API host.

### Reading a table: PostgREST caps every response at 1,000 rows

It reports **success** while doing it, so a truncated read is indistinguishable from a
complete one at runtime. Four separate defects have come from this (TODO-090, 122, 126, and
the `listCuisines` one). If you are aggregating — counting, ranking, grouping — route the
read through **`fetchAllPages`** in `src/lib/api/shared.ts`.

Two rules that are not obvious:

- **`.order("id")` before `.range()`, always.** Postgres does not guarantee row order
  without `ORDER BY`, so range paging can return a row on two pages or on none. A
  sequential scan of a static table happens to be stable, which is why three call sites
  omitted it for months without visible damage — the guarantee was incidental (TODO-127).
  `fetchAllPages` takes a page fetcher, not a query builder, so it cannot enforce this and
  `paging.test.ts` cannot catch a violation.
- **`.in(...)` bounds a read but does not make it safe.** The bound is data-dependent.
  `listRestaurants` sat at 848 of 1,000 for its top-60 tag rows — correct, until tagging
  density moved.

**The tell in production is arithmetic, not an error.** On `/tastemakers` the per-user tag
counts read 871 + 129 = exactly 1000 while the profile page showed 932. If aggregate counts
sum to precisely 1,000, the read was truncated.

Any test for this must model the cap the way PostgREST behaves — an unranged read returns
1,000 rows and reports success. A fake that just returns everything passes against the bug.

## Deployment
- **Platform:** Railway (Node.js, using default Next.js build output)
- **Prod domains (live):** `www.tastemakersapp.com` and `tastemakersapp.com` (apex) both serve this app.
  `api.tastemakersapp.com` is the Laravel API. `app.tastemakersapp.com` was **retired 2026-08-18** —
  do not reintroduce it; Railway's Hobby plan caps custom domains at 2 per service.
- **Required env var:** `NEXT_PUBLIC_API_URL=https://api.tastemakersapp.com/api` (points to Railway-hosted Laravel backend)
- **The two site-URL variables — do NOT merge them.** They answer different questions:

  | Variable | Question | Local dev | Consumer |
  |---|---|---|---|
  | `NEXT_PUBLIC_SITE_URL` | "where is *this instance* reachable?" | `http://localhost:3050` | `resolveCallbackOrigin` (`src/lib/auth.ts`) — OAuth must return to the machine that sent the user away |
  | `NEXT_PUBLIC_CANONICAL_ORIGIN` | "what is the *public home* of this content?" | unset → production default | `CANONICAL_ORIGIN` / `canonical()` (`src/lib/site.ts`) — every `rel=canonical`, `og:url`, JSON-LD `url`, sitemap, robots |

  If canonicals ever derive from `NEXT_PUBLIC_SITE_URL`, a local `next build` publishes
  localhost canonicals and a localhost sitemap. `src/lib/site.test.ts` fails if anyone tries.
  Both are `NEXT_PUBLIC_*`, so they are **inlined at build time** — changing either on Railway
  requires a redeploy. Moving domains is one variable plus a redeploy; do not hardcode hosts.
- **Admin auth env vars (server-only, no NEXT_PUBLIC_ prefix):**
  - `SUPABASE_URL` — Supabase project URL (used in Edge middleware)
  - `SUPABASE_ANON_KEY` — Supabase anon key (used in Edge middleware)
  - `ADMIN_EMAILS` — comma-separated allowlist (e.g. `user@example.com,other@example.com`). If empty/unset, all authenticated Supabase users can access admin.
  - Client-side components also need `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the login page OAuth flow.
  - Supabase redirect URLs must include `http://localhost:3050/auth/callback` (dev),
    `https://www.tastemakersapp.com/auth/callback` and `https://tastemakersapp.com/auth/callback` (prod)
    — Supabase Dashboard → Authentication → URL Configuration. `redirectTo` is built from
    `window.location.origin`, so any host the app answers on must be allowlisted or Supabase
    silently falls back to the Site URL.
- **Railway project:** Use same project as backend (shared infrastructure), separate services for backend (Laravel) and frontend (Next.js)
- **Note:** Build script (`npm run build`) generates `.next/` directory. Railway will serve static files + run server functions via Node.js.

## API Integration
- **Dev:** No proxy. `/api/*` is served by this app's own route handlers in
  `src/app/api` in every environment. `NEXT_PUBLIC_API_URL` is still set in
  `.env.local`, but is effectively decorative — its only remaining consumer is
  `restaurantImageUrl()`, which builds an image host string, not an API call.
  The would-be Laravel client has been deleted; nothing imported it.
- **Prod:** Set `NEXT_PUBLIC_API_URL` to `https://api.tastemakersapp.com/api` (Railway-hosted Laravel backend)
- **Auth:** Bearer token stored in localStorage (upgrade to httpOnly cookies later)
- **Client:** none. This app does not call the Laravel API — see the Data layer section.

## Testing
- **Runner:** Vitest (`npx vitest run`)
- **Hook tests:** `// @vitest-environment jsdom` at top of file + `@testing-library/react`
- **Path alias:** `vitest.config.ts` resolves `@/` → `./src/` (required for hook tests that import `@/lib/supabase`)
- **Current suite:** 486 tests across 43 files — all green. Compare against this number before blaming your own change; verify by stashing and running on `main` rather than assuming.
- **Scope:** `vitest.config.ts` includes `src/**/*.test.ts`, `src/**/*.test.tsx` **and** `scripts/**/*.test.mjs`. The `.tsx` glob matters — without it a component test is silently skipped ("No test files found"), not failed.
- **Component tests:** `// @vitest-environment jsdom` + `@testing-library/react`, and an explicit `cleanup()` in `afterEach` — automatic cleanup is not registered without `globals: true`. JSX is transformed by `@vitejs/plugin-react` in `vitest.config.ts`.

| File | Tests | What it covers |
|------|-------|----------------|
| `src/lib/api/shared.test.ts` | 39 | `buildTagsByRestaurant` per-restaurant levelling, `cityFromAddress` against real production address shapes, `toRestaurant` slugs; `tasteLevel` boundaries (2/5/10/20) and `levelLabel`, anchored to the three tastemakers actually on the live site|
| `src/features/tags/RankedTagCloud.test.tsx` | 11 | Vote flow: optimistic add, **rollback on 409 `vote_blocked`** and on network failure, re-levelling, signed-out gating |
| `src/features/tags/levels.test.ts` | 11 | iOS `calcucateTagLevels` parity — gap-from-leader, all-equal degenerate case |
| `src/lib/slug.test.ts` | 15 | Slugify, chain collisions, accents, non-Latin fallback, id parsing |
| `src/features/email/subscribe.test.ts` | 14 | beehiiv request shaping and error mapping; never leaks a credential failure |
| `src/features/search/query.test.ts` | 13 | PostgREST filter sanitising — a query cannot widen its own filter |
| `src/lib/api/paging.test.ts` | 8 | `fetchAllPages` — the 1000-row PostgREST cap, exact-multiple boundary, runaway guard |
| `src/features/cuisines/api.test.ts` | 3 | `listCuisines` reads past the 1000-row cap. The fake models PostgREST truthfully — an unranged read returns 1000 rows and reports **success** — so a test that skips that passes against the bug (TODO-090) |
| `src/features/restaurants/listing.test.ts` | 3 | `listRestaurants` — a restaurant whose tag rows sit past the cap still gets its tags, plus an in-cap control and the ranking (TODO-122). The control matters: most cards looked right, which is why this went unseen |
| `src/lib/admin-gate.test.ts` | 10 | `adminGateDecision` — the only thing between the public internet and `/admin`, and it had no tests until 2026-08-20. The gate used to be wrapped in `if (configured && ...)`, so a missing env var **skipped** it and served the panel to anyone. Also covers an empty `ADMIN_EMAILS` denying, and `/administrators` not being gated (TODO-097) |
| `src/lib/api/tastemakers.test.ts` | 9 | `listTastemakers` / `getTastemaker` — tag counts past the cap, the "counts must never sum to exactly 1000" tell (TODO-126), and case-insensitive slug resolution reporting the canonical casing for the 308 (TODO-128) |
| `src/app/auth/callback/route.test.ts` | 5 | OAuth `?next` open redirect. Asserts on `new URL(location).host`, not string equality, so it catches any bypass. `@evil.com` and `.evil.com` escape the origin; `//evil.com` does not (TODO-093) |
| `src/app/boundaries.test.tsx` | 4 | `error.tsx` / `not-found.tsx` — that retry actually calls `reset`, that the raw error message is never rendered, that 404 links somewhere real |
| `src/features/shell/ListingSkeleton.test.tsx` | 2 | `role="status"` + `aria-busy` on the loading fallback — a skeleton with no announcement is silence to a screen reader |
| `src/features/tags/ramp.test.ts` | 7 | Ramp contrast ≥4.5:1, monotonic prominence, even L* spacing, non-colour channel |
| `src/lib/api/image-url.test.ts` | 7 | Photo URLs resolve against the API host, not a relative path |
| `src/lib/pg-errors.test.ts` | 5 | Unique-violation matching, both directions |
| `src/lib/admin-theme.ts` test | 6 | `ADMIN_THEME` is the single source for admin page colours. Themed roles must be `var(--tm-*)`; data-viz colours must stay literals. Also asserts no admin page declares a local `const t = {}` or assigns a hex to a themed role — the defect that left `/admin/api` ignoring the light/dark toggle (TODO-034) |
| `src/styles/css-wiring.test.ts` | 3 | Every `tm-*` class is defined; every stylesheet is imported |
| `src/lib/docs.test.ts` | 63 | Auto-walk registry, frontmatter parsing, H1 title extraction (code-fence + HTML-comment guard), section grouping, exclusions, search, status badges, **client/server boundary guard (SOL-004)** |
| `scripts/refresh-docs.test.mjs` | 22 | `computeCostRows` unit economics (hand-checked), frontmatter, status-block build, **marker-replacement idempotency**, real roadmap/todo table parsing |
| `scripts/sync-inbox.test.mjs` | 21 | Comment validation + skip warnings, newest-first sort, **change_request-first ordering**, resolved-section split, pluralisation, empty inbox |
| `src/lib/auth.test.ts` | 22 | `parseAllowedEmails`, `isEmailAllowed`, `safeRedirectPath`, `resolveCallbackOrigin` (Railway port fix) |
| `src/lib/validation.test.ts` | 17 | `validateEmail`, `validatePassword`, `validateRequired` |
| `src/lib/api-probe.test.ts` | 12 | `runCheck` — live health probe utility |
| `src/lib/admin-filters.test.ts` | 13 | `filterTodos` (AND logic, sentinel), `summarizeRoadmap` (P1 counter excludes done) |
| `src/lib/github.test.ts` | 7 | `fetchCommits` — GitHub API fetch, cache, error handling |
| `src/lib/docs.test.ts` | 14 | `fetchMarkdown` — local + GitHub source loading, DOCS_REGISTRY completeness, `fetchDocUpdated` |
| `src/lib/trends.test.ts` | 5 | 12-week trend data shape, week-over-week deltas |
| `src/lib/city-stats.test.ts` | 8 | 30d city leaderboard sorting, delta calculation; `buildCityEvents` no-FK join (unknown ids, cutoff) |
| `src/lib/activity-feed.test.ts` | 3 | Merged feed ordering, type tagging |
| `src/lib/posthog.test.ts` | 3 | `posthogQuery` — HogQL client, error handling |
| `src/lib/markdown.test.ts` | 4 | `renderMarkdown` — tables, inline formatting, link targets, escaping |

**Mock pattern for `useAuth.test.ts`:** `vi.mock("@/lib/supabase", ...)` + `vi.clearAllMocks()` in `beforeEach`. Use `mockFetch.mock.lastCall!` not `calls[0]` to avoid stale-call bugs across tests.

## API Endpoints (same as iOS/Android)
- **Auth:** `POST /api/login`, `/api/signup`, `/api/google-login`
- **User:** `GET /api/user`, `POST /api/update-profile`
- **Restaurants:** `GET /api/restaurants`, `/api/restaurant-detail`
- **Tags:** `GET /api/tags`, `POST /api/restaurant-tag`
- **Lists:** `GET /api/gettastemaker-List`, `POST /api/ListTitleSave`

## Implementation Plan

### Phase 1: Foundation
1. ~~Install and configure Tailwind CSS~~ ✅ Done (v3)
2. Set up global layout with responsive navigation (mobile-first)
3. Create shared UI components (Button, Card, Input, Modal, LoadingSpinner)
4. Set up error boundary and 404/500 pages
5. Add Google Fonts and brand assets

### Phase 2: Authentication
1. Build Login page (`/login`)
2. Build Registration page (`/register`)
3. Integrate Google OAuth (client-side flow)
4. Build Forgot Password flow (`/forgot-password`)
5. Add auth context/provider for session state
6. Protect authenticated routes with middleware

### Phase 3: Core Pages
1. **Home / Discover** (`/`) — Featured restaurants, trending tastemakers, nearby cuisine
2. **Restaurant Detail** (`/restaurant/[placeId]`) — Details, tags, photos, map embed, bookmark
3. **Search** (`/search`) — Search restaurants by name, cuisine, tags, location
4. **Cuisine Browse** (`/cuisine/[type]`) — Restaurants filtered by cuisine
5. **Tastemaker Profile** (`/tastemaker/[username]`) — Public profile, lists, reviews

### Phase 4: User Features
1. **Profile** (`/profile`) — View/edit profile, social links, avatar
2. **My Bookmarks** (`/bookmarks`) — Saved restaurants and lists
3. **My Lists** (`/lists`) — Create and manage restaurant lists
4. **List Detail** (`/list/[id]`) — View list with restaurants on map
5. **Photo Upload** — Upload restaurant photos with drag-and-drop

### Phase 5: Maps & Location
1. Integrate Google Maps JavaScript API for restaurant maps
2. Implement geolocation for "near me" functionality
3. Map view for restaurant lists
4. Restaurant clustering on map at zoom levels

### Phase 6: SEO & Performance
1. Server-side rendering for restaurant and tastemaker pages (SEO)
2. Open Graph meta tags for social sharing
3. Structured data (JSON-LD) for restaurants
4. Image optimization with `next/image`
5. Lighthouse performance audit and fixes

### Phase 7: Progressive Web App
1. Add service worker for offline support
2. Add web app manifest
3. Push notification support via FCM web
4. Install prompt for mobile browsers

## Docs system (`docs/`)

This repo hosts the project knowledge base, rendered by the admin board at `/admin/docs`.
Full spec: **`docs/README-DOCS.md`**. Summary below — read it before writing any doc.

### Session ritual — do this first

**At the start of a session, read `docs/INBOX.md`.**
1. Act on `change_request` items first (they render at the top for that reason)
2. Answer `question` items
3. Write a resolution for each one handled: set `status: resolved`, add a note **and a
   link** (commit SHA or doc id) in `docs/_comments.json`
4. Re-run `npm run docs:inbox` so it clears

A comment cannot reach `resolved` without a link — a resolution nobody can verify is
just a claim it was handled. Leaving an item `open` is a legitimate outcome.

### Frontmatter — required on every authored doc

No frontmatter → the board cannot index it. It must be the first thing in the file.

```yaml
---
id: PRD-001          # stable, never reused or renumbered
type: prd            # decides which board section it lands in
status: draft        # draft | active | locked | done | deprecated
phase: null
owner: james
tags: []             # controlled vocabulary ONLY (below)
links: []            # ids of related docs — this is the traceability trail
updated: 2026-07-23
---
```

Optional: `priority` (`p1|p2|p3`, for todos/risks) · `shipped` (`true|false`, PRDs only —
`status` describes the doc's lifecycle, `shipped` describes the feature's).

### Controlled tag vocabulary — 14 tags, no freeform

| Domain | Platform | Concern |
|---|---|---|
| `tagging` `discovery` `lists` `social` `photos` `accounts` | `backend` `ios` `web` `android` | `security` `data-model` `ai` `infra` |

Most docs want 2–4: one domain, one platform, one concern. **Never invent a tag inline** —
adding a 15th is a deliberate decision, recorded in `docs/engineering/decision-log.md`.

### ID scheme — one number block per section, never reused

`PRD-###` product reqs · `ADR-###` architecture decisions · `DOC-###` general docs ·
`RISK-###` risks · `EXP-###` experiments · `SOL-###` solved problems ·
`TODO-###` code-review findings · `RM-##` roadmap rows · `TASK-##` to-do rows

**ADR vs decision-log:** an ADR is for decisions expensive to reverse (framework, database,
auth model, module boundaries). Everything smaller is one line in the decision log:
date · decision · why. If unsure, it's a decision-log entry.

### Generated docs — never hand-edit

`under-the-hood/stats.md`, `costs.md`, `system-status.md`, and `INBOX.md` are regenerated
from real data. Edit the **inputs** (`docs/costs.config.json`, `docs/_comments.json`).

```bash
npm run docs:refresh   # stats, costs, system status, + the status block in README/CLAUDE
npm run docs:inbox     # regenerate docs/INBOX.md from _comments.json
```

**Run `npm run docs:refresh` before every push.** What the board shows should be what is
true. Templates in `docs/_templates/` are excluded from indexing by design.


### Removed 2026-08-19 — do not reintroduce

`src/lib/api.ts`, `src/lib/api/client.ts` and `src/hooks/useAuth.ts` were deleted. All
three had **zero non-test importers**: they were a Laravel API client this app never calls
(it reads Supabase directly, TODO-089) and a duplicate session hook. The live `useAuth` is
the one exported by `src/components/providers/AuthProvider.tsx` — there were two, and the
unused copy was the one in `hooks/`.

Their tests went with them, which is why the suite count moved 419 -> 411 (-19 for the
deleted tests, +11 for page-caching). A falling number is the right outcome when the code
under test no longer exists.

## Rules
- Port **3050** for dev server — never use other ports
- All API types in `src/types/index.ts` must match the Laravel API response format
- Use Server Components by default, `"use client"` only when needed
- Path alias: `@/*` maps to `./src/*`
- Match iOS/Android feature behavior — refer to `tastemakers-ios/` for expected UX
- Never store secrets in client-side code — use environment variables with `NEXT_PUBLIC_` prefix only for public values

## Dashboard Pages — Keep Updated (CRITICAL)
After ANY development work, update the relevant dashboard pages before finishing:

| Page | File | What to update |
|------|------|----------------|
| `/admin/tech` | `src/app/admin/tech/page.tsx` | BUILD_JOURNAL, STATS, TECH_STACK, FEATURE_MODULES, LESSONS, AI_WORKFLOW |
| `/admin/roadmap` | `src/app/admin/roadmap/page.tsx` | PLATFORM_ROADMAP array — milestones per platform, update status/detail |
| `/admin/changelog` | `src/app/admin/changelog/page.tsx` | RELEASES array — add new version entries |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | SERVICES status, PostHog query |
| `/admin/status` | `src/app/admin/status/page.tsx` | SYSTEM_INFO if infra changes |
| `/admin` (layout) | `src/app/admin/layout.tsx` | NAV_ITEMS if new pages added |
| `/admin/todo` | `src/app/admin/todo/page.tsx` | TODO_ITEMS array — add new tasks, update status |
| `/admin/platforms/[id]` | `src/app/admin/platforms/[id]/page.tsx` | PLATFORM_DATA — todos, commits, versions per platform |

All data is TypeScript arrays/objects at the top of each file — no hardcoded JSX. Update the data, the UI renders automatically.

### When a finding is fixed:
1. In `/roadmap`: Change finding `status: "open"` → `"completed"`, add `fixedDate: "YYYY-MM-DD"`
2. In `/roadmap`: Update HEALTH_CATEGORIES scores, OVERALL_SCORE
3. In `/roadmap`: Update PRODUCT_ROADMAP item status → `"done"`
4. In `/changelog`: Add the fix to the current release's changes array
