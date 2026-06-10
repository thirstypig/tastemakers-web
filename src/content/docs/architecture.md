# System Architecture

> Updated 2026-06-09

## Topology

```
 iOS (Swift/UIKit, App Store)──┐
 Android (Kotlin/Compose, dev)─┼──► Laravel 8 API ──► Supabase PostgreSQL
 Web public pages (Next.js) ───┘    (Railway)         (22 tables)
                                       ▲
 Admin panel (Next.js /admin) ─────────┘ (also queries Supabase directly
                                          via service-role for dashboards)
```

## Services & domains

| Domain | Service | Notes |
|--------|---------|-------|
| api.tastemakersapp.com | Laravel 8, Railway | Bearer-token API for all clients |
| app.tastemakersapp.com | Next.js 15, Railway | Public SEO pages + /admin |
| www.tastemakersapp.com | Static HTML + Caddy, Railway | Marketing / email capture |

DNS: domain registered at Namecheap, **Squarespace nameservers are the authority**,
CNAMEs → Railway. Legacy: `tastemakersapp.com/v2/api/` (Namecheap shared hosting)
still serves old iOS builds until App Store migration completes.

## Auth — two separate systems

1. **API clients (iOS/Android/web public):** Laravel Passport bearer tokens
   (`POST /api/login`, `/google-login`, `/apple-login`). RSA keys from env vars.
2. **Admin panel:** Supabase Google OAuth (PKCE) → session cookies →
   `src/middleware.ts` gates `/admin/*` against `ADMIN_EMAILS` allowlist.
   These systems share nothing.

## Data model (core)

`users` ─< `restaurant_user` (saves) >─ `restaurants`
`users` ─< `restaurant_tag` (one row per user+restaurant+tag = a "vote") >─ `tags`
`users` ─< `testmaker_list` (curated lists, `list_name`)

Tag popularity = COUNT of `restaurant_tag` rows per (restaurant, tag).
No FK constraints in the legacy schema — application-level integrity only;
admin dashboard queries join in JS, not via PostgREST embeds.

## Repos (GitHub `thirstypig/`, source of truth)

tastemakers-backend · tastemakers-web · tastemakers-ios (branch `master`) ·
tastemakers-android · tastemakers-marketing. Root folder is **not** a git repo;
cross-project docs live in tastemakers-web `src/content/docs/`.
