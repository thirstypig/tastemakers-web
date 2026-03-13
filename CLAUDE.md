# Tastemakers Web — Claude Code Context

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
│   │   └── page.tsx           Home page
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

## API Integration
- **Dev:** Requests to `/api/*` are proxied to `http://localhost:4050/api/*` via `next.config.ts` rewrites
- **Prod:** Set `NEXT_PUBLIC_API_URL` to production API URL
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
