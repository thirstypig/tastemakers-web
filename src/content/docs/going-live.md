# Going Live — Tastemakers Migration Roadmap

**Last updated:** May 2026  
**Status:** Active migration from Namecheap shared hosting → Railway

---

## Current Deployment Status

| Service | Status | URL | Notes |
|---------|--------|-----|-------|
| Marketing site | ✅ LIVE | www.tastemakersapp.com | Static HTML on Railway + Caddy |
| Web app (Next.js) | ✅ LIVE | app.tastemakersapp.com | Railway, GitHub auto-deploy |
| Laravel API | ✅ LIVE | api.tastemakersapp.com | Railway, Dockerfile build, Supabase DB |
| iOS app | ⚠️ Old API | App Store ID: 1573533249 | Still pointing to Namecheap — needs update |
| Android app | ❌ Won't compile | thirstypig/tastemakers-android | Hilt module missing + premature Firebase deps |
| Database | ✅ LIVE | Supabase (PostgreSQL) | Project: zdeyrwzztsyezfxxtdcs |
| DNS | ✅ Configured | Squarespace nameservers | All CNAME records set |

---

## Backend API — Remaining Steps

The API is deployed and connected to Supabase. Outstanding work:

- [ ] **Passport install** — run `php artisan passport:install` once to generate OAuth client records in Supabase. Required for mobile app token-based login.
- [ ] **Seed environment secrets** — FCM server key, Foursquare API key, Apple Sign-In credentials must be added as Railway env vars (currently missing).
- [ ] **Data migration** — decide whether to migrate existing user/restaurant data from Namecheap MySQL or start fresh. If migrating: export MySQL → transform → import to Supabase PostgreSQL.
- [ ] **End-to-end test with iOS** — verify login, token storage, restaurant list, tastemaker lists all work against the new API.
- [ ] **Cancel Namecheap** — only after iOS is confirmed working on new API.

### Future: Migrate auth to Supabase

Currently using Laravel Passport (OAuth2). Long-term plan: replace with Supabase Auth so iOS, Android, and web share one auth provider. This eliminates the Passport dependency and simplifies token management across all clients.

---

## iOS App — Going Live

The iOS app is on the App Store and functional — it just points to the old API.

### Steps to switch

1. Confirm `php artisan passport:install` has run on Railway
2. Update `API_BASE_URL` in the iOS codebase from `https://tastemakersapp.com/v2/api/` to `https://api.tastemakersapp.com/api/`
3. Test auth (login, signup, Google Sign-In, Apple Sign-In)
4. Test core flows: restaurant list, tastemaker lists, bookmarks, photo upload
5. Submit App Store update for review (~24–48h review time)
6. After App Store approval: cancel Namecheap shared hosting

**Repo:** `thirstypig/tastemakers-ios`  
**Blocker:** Passport install + env secrets must be done first

---

## Web App — Implementation Plan

The web app is live and hosts the admin/dashboard. The full user-facing app is the next major build:

### Phase 1: Auth (next sprint)
- `/login` — email + password login via `POST /api/login`
- `/register` — new account via `POST /api/signup`
- Google OAuth integration (`POST /api/google-login`)
- Auth context and Bearer token management
- Protected route middleware

### Phase 2: Core Pages
- `/` Home/Discover — featured restaurants, trending tastemakers, nearby cuisine
- `/restaurant/[placeId]` — details, tags, photos, map embed
- `/search` — search by name, cuisine, tags, location
- `/tastemaker/[username]` — public profile, lists, reviews

### Phase 3: User Features
- `/profile` — view/edit profile, avatar
- `/bookmarks` — saved restaurants and lists
- `/lists` — create and manage restaurant lists
- Photo upload with drag-and-drop

### Phase 4: SEO & Performance
- Server-side rendering for restaurant and tastemaker pages
- Open Graph meta tags for social sharing
- Structured data (JSON-LD) for restaurants
- Lighthouse performance audit

---

## Android App — What's Blocking

The Android app currently **does not compile**.

### Known blockers
1. **Missing Hilt module** — dependency injection setup is incomplete; build fails at Hilt annotation processing
2. **Premature Firebase deps** — Firebase Cloud Messaging dependencies are declared but not properly initialized

### Steps to fix and ship
1. Fix Hilt module: add missing `@HiltAndroidApp` annotation or provide the missing module
2. Fix Firebase initialization — move to proper `FirebaseApp.initializeApp()` in Application class
3. Migrate `kapt` → `KSP` (Google's recommended annotation processor for Kotlin)
4. Update API URL to `https://api.tastemakersapp.com/api/`
5. Build, test on device
6. Publish to Google Play Store

**Repo:** `thirstypig/tastemakers-android`

---

## Infrastructure Summary

```
Railway Project: Tastemakers (c6fd4935-ffeb-4cd9-9185-81a941bcb6c7)
├── tastemakers-marketing  →  www.tastemakersapp.com
├── tastemakers-web        →  app.tastemakersapp.com
└── tastemakers-backend    →  api.tastemakersapp.com

Database: Supabase PostgreSQL
├── Project ref: zdeyrwzztsyezfxxtdcs
├── Connection: Pooler (aws-1-us-west-1.pooler.supabase.com:5432)
└── User: postgres.zdeyrwzztsyezfxxtdcs

DNS: Squarespace nameservers
└── All CNAME records point to Railway service URLs
```

---

## Code Repos

| App | Repo | Status |
|-----|------|--------|
| iOS | thirstypig/tastemakers-ios | Active, App Store live |
| Android | thirstypig/tastemakers-android | Active, not on Play Store |
| Web | thirstypig/tastemakers-web | Active, Railway live |
| Backend | thirstypig/tastemakers-backend | Active, Railway live |
| Marketing | thirstypig/tastemakers-wordpress | WordPress repo (legacy) |

> GitLab (`ideveloper1990/`) has stale copies of iOS and backend — no access to that account. GitHub is source of truth.
