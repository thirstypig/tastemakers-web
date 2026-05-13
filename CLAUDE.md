# Tastemakers Web — Claude Code Context

## Current status

<!-- now-tldr -->
Next.js 15 + TypeScript frontend for Tastemakers — public SEO pages (tastemakers, lists, restaurants) + admin panel with Supabase Google OAuth. Public pages use iOS-matched purple/pink brand palette with Roboto font. Data served from typed stub layer in `src/lib/api/` until Laravel endpoints come online. 66 unit tests green. Deployed to `app.tastemakersapp.com` on Railway (pending).
<!-- /now-tldr -->

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
npx vitest run     # run 66 unit tests (6 test files)
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
│   │   ├── page.tsx           Dev dashboard home (links to tech/roadmap/etc)
│   │   ├── auth/callback/     PKCE OAuth code exchange route (Supabase Google OAuth)
│   │   ├── tech/page.tsx      Under the Hood — architecture, stack, schema
│   │   ├── roadmap/page.tsx   Roadmap — health score, 50 findings, plan
│   │   ├── changelog/page.tsx Changelog — 11 releases, ~130 changes
│   │   ├── status/page.tsx    System Status — live health checks
│   │   ├── analytics/page.tsx Analytics — velocity, metrics, questions
│   │   ├── (public)/          PUBLIC route group (SEO pages — no auth required)
│   │   │   ├── layout.tsx          Public layout: sticky header + footer (purple/pink brand)
│   │   │   ├── tastemakers/page.tsx         → /tastemakers  (grid of tastemakers)
│   │   │   ├── tastemakers/[slug]/page.tsx  → /tastemakers/:slug (profile + JSON-LD)
│   │   │   ├── lists/[slug]/page.tsx        → /lists/:slug  (coming next)
│   │   │   └── restaurants/[id]/page.tsx    → /restaurants/:id (coming next)
│   │   └── admin/             Terminal/DevTool admin (Paper + Gruvbox themes)
│   │       ├── layout.tsx          Chrome: command bar, sidebar, status footer, ⌘K palette
│   │       ├── page.tsx            Overview — KPIs, platforms, errors, roadmap
│   │       ├── login/page.tsx      Supabase OAuth (Google) login
│   │       ├── users/page.tsx      User table with filter chips
│   │       ├── platforms/[id]/     Per-platform: stats, todos, commits, routes
│   │       ├── roadmap/page.tsx    Accordion P1/P2/P3 with clickable status toggle
│   │       ├── changelog/page.tsx  Versioned changelog with + / ~ / - diff style
│   │       ├── routes/page.tsx     API route table with method/auth filters
│   │       ├── errors/page.tsx     Error log with severity filters
│   │       ├── analytics/page.tsx  PostHog / GA / Search Console stubs
│   │       ├── docs/page.tsx       Documentation file index
│   │       └── docs/[id]/page.tsx  Individual doc detail
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
│   │   ├── api.ts             Admin API client (apiFetch<T>() with auth headers) — NOT the same as lib/api/
│   │   ├── auth.ts            Pure fns: parseAllowedEmails, isEmailAllowed (used by middleware)
│   │   ├── supabase.ts        Supabase client factory (SSR-safe)
│   │   └── validation.ts      Form validation helpers (email, password, required)
│   └── types/
│       └── index.ts           TypeScript interfaces matching API models
├── public/                    Static assets
├── next.config.ts             API proxy rewrites + devIndicators: false
├── vitest.config.ts           Vitest config — @/ alias, jsdom env for hook tests
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
- **Current suite:** 66 tests across 6 files — all green

| File | Tests | What it covers |
|------|-------|----------------|
| `src/lib/auth.test.ts` | 12 | `parseAllowedEmails`, `isEmailAllowed` edge cases |
| `src/lib/validation.test.ts` | 17 | `validateEmail`, `validatePassword`, `validateRequired` |
| `src/lib/api.test.ts` | 12 | `apiFetch` — response handling, headers, auth token |
| `src/lib/api-probe.test.ts` | 7 | `runCheck` — live health probe utility |
| `src/lib/docs.test.ts` | 10 | Docs library utilities |
| `src/hooks/useAuth.test.ts` | 8 | `useAuth` — session resolution, auth events, cleanup |

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
| `/tech` | `src/app/tech/page.tsx` | BUILD_JOURNAL, STATS, TECH_STACK, FEATURE_MODULES, LESSONS, AI_WORKFLOW |
| `/roadmap` | `src/app/roadmap/page.tsx` | P1/P2/P3_FINDINGS (status, fixedDate), PRODUCT_ROADMAP (status), HEALTH_CATEGORIES scores, SESSION_VELOCITY, NEXT_SESSION, RISK_REGISTER |
| `/changelog` | `src/app/changelog/page.tsx` | Add new RELEASES entry (version, date, session, title, 3 highlights, changes with type badges) |
| `/analytics` | `src/app/analytics/page.tsx` | VELOCITY_DATA (new session), PRODUCT_METRICS status |
| `/status` | `src/app/status/page.tsx` | SYSTEM_INFO if infra changes |
| `/admin` | `src/app/admin/layout.tsx` | NAV_ITEMS if new pages added |
| `/admin/roadmap` | `src/app/admin/roadmap/page.tsx` | ROADMAP_ITEMS array — add new todos, update statuses |
| `/admin/changelog` | `src/app/admin/changelog/page.tsx` | RELEASES array — add new version entries |
| `/admin/platforms/[id]` | `src/app/admin/platforms/[id]/page.tsx` | PLATFORM_DATA — todos, commits, versions per platform |

All data is TypeScript arrays/objects at the top of each file — no hardcoded JSX. Update the data, the UI renders automatically.

### When a finding is fixed:
1. In `/roadmap`: Change finding `status: "open"` → `"completed"`, add `fixedDate: "YYYY-MM-DD"`
2. In `/roadmap`: Update HEALTH_CATEGORIES scores, OVERALL_SCORE
3. In `/roadmap`: Update PRODUCT_ROADMAP item status → `"done"`
4. In `/changelog`: Add the fix to the current release's changes array
