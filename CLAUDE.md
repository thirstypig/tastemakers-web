# Tastemakers Web — Claude Code Context

## Current status

<!-- now-tldr -->
Next.js 15 + TypeScript frontend for Tastemakers — currently hosts five live dashboard pages (`/tech`, `/roadmap`, `/changelog`, `/status`, `/analytics`) tracking project health, velocity, and known issues. Targeted for Vercel deployment as both the marketing site (`www.tastemakersapp.com`) and the web app (`app.tastemakersapp.com`), consuming the Laravel API hosted on Railway. Awaiting backend migration before going live.
<!-- /now-tldr -->

## Project Overview
Web frontend for the Tastemakers restaurant discovery platform. Built with Next.js 15 and TypeScript. This is a new project being built to bring the Tastemakers experience to the browser.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** TBD (Tailwind CSS recommended)
- **State:** React Server Components + client hooks
- **API:** Proxied to Laravel backend at `localhost:4050`
- **Dev Server Port:** 3050

## Setup
```bash
npm install
npm run dev        # starts on port 3050
npm run build      # production build
npm run type-check # TypeScript validation
```

## Project Structure
```
tastemakers-web/
├── src/
│   ├── app/                   Next.js App Router pages
│   │   ├── layout.tsx         Root layout
│   │   ├── page.tsx           Home (card grid linking all pages)
│   │   ├── tech/page.tsx      Under the Hood — architecture, stack, schema
│   │   ├── roadmap/page.tsx   Roadmap — health score, 50 findings, plan
│   │   ├── changelog/page.tsx Changelog — 9 releases, 99 changes
│   │   ├── status/page.tsx    System Status — live health checks
│   │   ├── analytics/page.tsx Analytics — velocity, metrics, questions
│   │   └── admin/
│   │       ├── layout.tsx     Admin sidebar layout
│   │       ├── page.tsx       Admin dashboard
│   │       └── login/page.tsx Admin login form
│   ├── components/            Shared React components
│   ├── hooks/                 Custom React hooks
│   ├── lib/
│   │   └── api.ts             API client (fetch wrapper with auth)
│   └── types/
│       └── index.ts           TypeScript interfaces matching API models
├── public/                    Static assets
├── next.config.ts             API proxy rewrites to localhost:4050
├── tsconfig.json              TypeScript config (strict, path aliases)
├── package.json               Dependencies and scripts
├── .env.local.example         Environment variable template
└── CLAUDE.md                  This file
```

## Deployment
- **Platform:** Vercel (preset: Next.js, auto-detected from `next.config.ts`)
- **Prod domains (planned):** `www.tastemakersapp.com` (marketing + blog), `app.tastemakersapp.com` (web app)
- **Required env var:** `NEXT_PUBLIC_API_URL=https://api.tastemakersapp.com/api` (points to Railway-hosted Laravel backend)
- **Known issue:** `src/app/tech/page.tsx:367` — Mermaid CDN import fails TypeScript check. Needs a `declare module` type declaration.

## API Integration
- **Dev:** Requests to `/api/*` are proxied to `http://localhost:4050/api/*` via `next.config.ts` rewrites
- **Prod:** Set `NEXT_PUBLIC_API_URL` to `https://api.tastemakersapp.com/api` (Railway-hosted Laravel backend)
- **Auth:** Bearer token stored in localStorage (upgrade to httpOnly cookies later)
- **Client:** `src/lib/api.ts` provides `apiFetch<T>()` helper with auto-auth headers

## API Endpoints (same as iOS/Android)
- **Auth:** `POST /api/login`, `/api/signup`, `/api/google-login`
- **User:** `GET /api/user`, `POST /api/update-profile`
- **Restaurants:** `GET /api/restaurants`, `/api/restaurant-detail`
- **Tags:** `GET /api/tags`, `POST /api/restaurant-tag`
- **Lists:** `GET /api/gettastemaker-List`, `POST /api/ListTitleSave`

## Implementation Plan

### Phase 1: Foundation
1. Install and configure Tailwind CSS v4
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

All data is TypeScript arrays/objects at the top of each file — no hardcoded JSX. Update the data, the UI renders automatically.

### When a finding is fixed:
1. In `/roadmap`: Change finding `status: "open"` → `"completed"`, add `fixedDate: "YYYY-MM-DD"`
2. In `/roadmap`: Update HEALTH_CATEGORIES scores, OVERALL_SCORE
3. In `/roadmap`: Update PRODUCT_ROADMAP item status → `"done"`
4. In `/changelog`: Add the fix to the current release's changes array
