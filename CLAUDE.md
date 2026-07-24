# Tastemakers Web — Claude Code Context

## Current status

<!-- now-tldr -->
Next.js 15 + TypeScript frontend for Tastemakers — public SEO pages (tastemakers, lists, restaurants) + admin panel with Supabase Google OAuth. Public pages use iOS-matched purple/pink brand palette with Roboto font. Data served from typed stub layer in `src/lib/api/` until Laravel endpoints come online. 127 unit tests green. Deployed live at `app.tastemakersapp.com` on Railway.
<!-- /now-tldr -->

<!-- DOCS:STATUS:START -->

## Current focus

_Generated 2026-07-24 by `npm run docs:refresh` — do not edit between these markers._

**Now:** RM-01 Finish the hosting migration · RM-02 Fix the P1 security backlog · RM-13 PostgreSQL compatibility sweep

**Next 3 to-dos:**

1. **TASK-01** (p1) — 🔴 **REVISED 2026-07-24 — already applied, not pending.** `UNIQUE (restaurant_id, tag_id)` is **live in production**. Drop it and replace with `UNIQUE (restaurant_id, tag_id, user_id)`. This stops the HTTP 500 on the second tagger (RISK-017) but **does not recover the deleted votes** — see TASK-18.
2. **TASK-18** (p1) — Attempt vote recovery: get a pre-migration dump of `restaurant_tag` from the legacy Namecheap MySQL host (cPanel → phpMyAdmin export, or any backup). The legacy DB was bound to `127.0.0.1` so it is unreachable remotely — this needs cPanel access. **Do it before the hosting is cancelled**, or the original vote counts are gone permanently.
3. **TASK-02** (p1) — Add an ownership check to `tastemaker_listdelete` — currently any authenticated user can delete any list by guessing an integer id

→ Full roadmap: [`docs/product/roadmap.md`](docs/product/roadmap.md)

<!-- DOCS:STATUS:END -->

## Project Overview
Web frontend for the Tastemakers restaurant discovery platform. Built with Next.js 15 and TypeScript. This is a new project being built to bring the Tastemakers experience to the browser.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v3 (installed, `tailwind.config.ts`)
- **State:** React Server Components + client hooks
- **API:** Proxied to Laravel backend at `localhost:4050`
- **Dev Server Port:** 3050

## Setup
```bash
npm install
npm run dev        # starts on port 3050
npm run build      # production build
npm run type-check # TypeScript validation
npx vitest run     # run 127 unit tests (13 test files)
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
│   │   └── useAuth.ts         Supabase session hook (user, loading, signOut)
│   ├── lib/
│   │   ├── api/               PUBLIC DATA LAYER — stub → real swap point
│   │   │   ├── types.ts           Tastemaker, CuratedList, Restaurant, Tag
│   │   │   ├── stubs.ts           Hardcoded mock data (3 tastemakers, 8 restaurants, 6 lists)
│   │   │   ├── client.ts          apiFetch() wrapper for api.tastemakersapp.com
│   │   │   └── index.ts           Exported fns: getTastemaker, getList, getRestaurant, etc.
│   │   │                          ↑ Swap stub→real here when Laravel endpoints come online
│   │   ├── admin-filters.ts   filterTodos() + summarizeRoadmap() — shared by admin roadmap + todo pages
│   │   ├── api.ts             Admin API client (apiFetch<T>() with auth headers) — NOT the same as lib/api/
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
├── next.config.ts             API proxy rewrites + devIndicators: false
├── vitest.config.ts           Vitest config — @/ alias, node environment
├── tsconfig.json              TypeScript config (strict, path aliases)
├── tailwind.config.ts         Tailwind CSS config
├── package.json               Dependencies and scripts
├── .env.local.example         Environment variable template
└── CLAUDE.md                  This file
```

## Public Design System (iOS-matched)

The `(public)` route group uses a brand palette ported from the iOS app:

| Token | Hex | Usage |
|-------|-----|-------|
| `pub-bg` | `#1A1038` | Page background |
| `pub-surface` | `#2A1A60` | Cards, header, footer |
| `pub-surface2` | `#3D296E` | Section backgrounds, tag level-1 |
| `pub-purple` | `#594094` | Tag level-2 |
| `pub-purple-md` | `#876DC4` | Tag level-3/4, muted elements |
| `pub-purple-lt` | `#B7ADCF` | Secondary text, nav links |
| `pub-muted` | `#8b81a3` | Tertiary text |
| `pub-pink` | `#DB1657` | Primary CTA, borders, badges |

- **Font:** Roboto (loaded via `next/font/google`, CSS var `--font-roboto`)
- **Hover effects:** CSS-only via `.pub-card` and `.pub-nav-link` in `globals.css` — no JS event handlers (required for Server Components)
- **Image domains:** `images.unsplash.com` (stubs), `*.foursquare.com`, `fastly.4sqi.net` (production)
- **Import note:** `src/lib/api.ts` (admin) and `src/lib/api/index.ts` (public) both exist. Use `@/lib/api/index` explicitly to import public data functions — `@/lib/api` resolves to the admin client file.

## Auth Architecture

- **Public pages** (`(public)/`): No auth. Server components fetch data directly.
- **Admin pages** (`/admin/*`): Gated by Supabase session via `src/middleware.ts`. Redirect to `/admin/login` if unauthenticated.
- **Public users**: Do not exist yet — read-only discovery only in this phase.
- **Supabase env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client + server), `SUPABASE_SERVICE_ROLE_KEY` (server-only).

## Stub → Real Data Layer Swap

When a Laravel endpoint comes online, open `src/lib/api/index.ts` and replace the stub call:
```ts
// Before (stub):
export async function getTastemaker(slug: string) {
  return STUB_TASTEMAKERS.find((t) => t.slug === slug) ?? null;
}

// After (real):
export async function getTastemaker(slug: string) {
  return apiFetch<Tastemaker>(`/api/tastemakers/${slug}`);
}
```
The rest of the app (`(public)` pages) doesn't change — they call `getTastemaker()` and don't know if it's stub or real.

## Deployment
- **Platform:** Railway (Node.js, using default Next.js build output)
- **Prod domains (planned):** `www.tastemakersapp.com` (marketing + blog), `app.tastemakersapp.com` (web app)
- **Required env var:** `NEXT_PUBLIC_API_URL=https://api.tastemakersapp.com/api` (points to Railway-hosted Laravel backend)
- **Admin auth env vars (server-only, no NEXT_PUBLIC_ prefix):**
  - `SUPABASE_URL` — Supabase project URL (used in Edge middleware)
  - `SUPABASE_ANON_KEY` — Supabase anon key (used in Edge middleware)
  - `ADMIN_EMAILS` — comma-separated allowlist (e.g. `user@example.com,other@example.com`). If empty/unset, all authenticated Supabase users can access admin.
  - Client-side components also need `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the login page OAuth flow.
  - Supabase redirect URLs must include `http://localhost:3050/auth/callback` (dev) and `https://app.tastemakersapp.com/auth/callback` (prod) — set in Supabase Dashboard → Auth → URL Configuration.
- **Railway project:** Use same project as backend (shared infrastructure), separate services for backend (Laravel) and frontend (Next.js)
- **Note:** Build script (`npm run build`) generates `.next/` directory. Railway will serve static files + run server functions via Node.js.

## API Integration
- **Dev:** Requests to `/api/*` are proxied to `http://localhost:4050/api/*` via `next.config.ts` rewrites
- **Prod:** Set `NEXT_PUBLIC_API_URL` to `https://api.tastemakersapp.com/api` (Railway-hosted Laravel backend)
- **Auth:** Bearer token stored in localStorage (upgrade to httpOnly cookies later)
- **Client:** `src/lib/api.ts` provides `apiFetch<T>()` helper with auto-auth headers

## Testing
- **Runner:** Vitest (`npx vitest run`)
- **Hook tests:** `// @vitest-environment jsdom` at top of file + `@testing-library/react`
- **Path alias:** `vitest.config.ts` resolves `@/` → `./src/` (required for hook tests that import `@/lib/supabase`)
- **Current suite:** 127 tests across 13 files — all green

| File | Tests | What it covers |
|------|-------|----------------|
| `src/lib/auth.test.ts` | 22 | `parseAllowedEmails`, `isEmailAllowed`, `safeRedirectPath`, `resolveCallbackOrigin` (Railway port fix) |
| `src/lib/validation.test.ts` | 17 | `validateEmail`, `validatePassword`, `validateRequired` |
| `src/lib/api.test.ts` | 12 | `apiFetch` — response handling, headers, auth token |
| `src/lib/api-probe.test.ts` | 12 | `runCheck` — live health probe utility |
| `src/lib/admin-filters.test.ts` | 13 | `filterTodos` (AND logic, sentinel), `summarizeRoadmap` (P1 counter excludes done) |
| `src/lib/github.test.ts` | 7 | `fetchCommits` — GitHub API fetch, cache, error handling |
| `src/lib/docs.test.ts` | 14 | `fetchMarkdown` — local + GitHub source loading, DOCS_REGISTRY completeness, `fetchDocUpdated` |
| `src/hooks/useAuth.test.ts` | 7 | `useAuth` — session resolution, auth events, cleanup |
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
