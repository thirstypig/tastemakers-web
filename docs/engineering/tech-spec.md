---
id: DOC-007
type: tech-spec
status: active
phase: null
owner: james
tags: [backend, web, infra]
links: [ADR-001, DOC-008]
updated: 2026-07-23
---

# Tech spec — architecture overview

**One API, four clients.** Every client speaks to the same Laravel API. That constraint
is the single most important thing about this architecture: an endpoint change is
never a one-repo change.

---

## System map

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  iOS app    │  │ Android app │  │  Web app    │  │  Marketing  │
│ Swift/UIKit │  │  (scaffold  │  │  Next.js 15 │  │ static HTML │
│  25 screens │  │  only — no  │  │             │  │   1 page    │
│             │  │   screens)  │  │             │  │             │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       │  ⚠️ still      │                │                │
       │  points at     │                │                │
       │  LEGACY host   │                │                │
       │                │                │                │
       └────────────────┴────────┬───────┘                │
                                 │                        │
                    ┌────────────▼─────────────┐  ┌───────▼────────┐
                    │  api.tastemakersapp.com  │  │ www.tastemakers│
                    │  Laravel 8 · PHP 8.1     │  │   app.com      │
                    │  Railway · Passport OAuth│  │ Railway/Caddy  │
                    └────────────┬─────────────┘  └────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Supabase PostgreSQL     │
                    │  17 tables · pgvector    │
                    └──────────────────────────┘

  app.tastemakersapp.com (Next.js) ALSO talks directly to Supabase
  for admin auth — a second, separate auth system. See "Two auth systems" below.
```

## Request flow — a user tags a restaurant

The core loop, end to end:

1. Client sends `POST /api/restaurant-tag` with a Bearer token, a `place_id`, and a
   **comma-separated** tag string.
2. Laravel `auth:api` middleware validates the token via Passport (RSA keys written to
   disk at boot from Railway env vars).
3. `RestaurantController::tagsRestaurant` looks up the restaurant by `place_id` —
   **and creates it if absent**.
4. For each tag: `Tag::firstOrCreate(['name' => $tag])`, then a SELECT to check this
   user hasn't already applied it.
5. `attach()` writes one `restaurant_tag` row per tag, stamped with `Auth::user()->id`.
6. On read, the rank is `count(restaurant_tag.tag_id) AS level`, ordered descending.

Full detail in `PRD-001` §6.

## Data path

| Layer | What's there |
|---|---|
| **Tables** | 17 via migrations. **Plus at least two created outside Laravel** — `testmaker_list` and a badges table are queried but have no migration. |
| **Access** | Eloquent models *and* 179 raw `DB::table()` calls in controllers. No repository layer. |
| **Vector** | `tags.embedding` — `vector(512)`, HNSW index, cosine. Used by the AI seeding pipeline for dedup at ≥ 0.85 similarity. |
| **Migrations** | Out of sync with reality — a 2.5-year gap (Jan 2024 → May 2026) implies direct schema edits. Check the `migrations` table before running `artisan migrate`. |

## Two auth systems

This is the part that surprises people, so it's called out explicitly.

| System | Used by | Mechanism |
|---|---|---|
| **Laravel Passport** | iOS, Android, web *public* features | OAuth2 Bearer tokens against `users` table |
| **Supabase Auth** | web *admin panel* only | Google OAuth (PKCE) → session cookie → `ADMIN_EMAILS` allowlist in Edge middleware |

They share no user records. An admin logging into the board is not a Tastemakers user.
**[inferred]** — this reads as pragmatic (admin needed auth before public web users
existed), not as a considered identity design.

## Services and external dependencies

| Service | Purpose | Status |
|---|---|---|
| Foursquare | venue search | ⚠️ `FOURSQUARE_API_KEY` unset on Railway → `/api/restaurants` fails |
| Google OAuth | social login | active |
| Apple Sign-In | social login | ⚠️ JWT signature never verified (TODO-003) |
| Firebase FCM | push notifications | ⚠️ SSL verification disabled (TODO-014) |
| Google Places | reviews for AI tag seeding | active, 2026 |
| Anthropic (`claude-haiku-4-5`) | tag extraction | built, never run at scale |
| Voyage AI (`voyage-3.5-lite`) | 512-dim embeddings | built, never run at scale |
| Supabase | Postgres + admin auth | active |
| PostHog / GA4 / AdSense | analytics, ads | web only; ads gated off |

## Deployment

All services on Railway (project `c6fd4935-ffeb-4cd9-9185-81a941bcb6c7`), GitHub
auto-deploy on push to the default branch.

**Constraints that bite:**
- **PHP pinned to 8.1.** Laravel 8 crashes on 8.4+. Local artisan/phpunit must use
  `/opt/homebrew/opt/php@8.1/bin/php`.
- **Railway runs Next.js on internal PORT=8080.** `request.url` in server code is
  `http://localhost:8080/...`, never the public domain. Use `NEXT_PUBLIC_SITE_URL` for
  redirect origins.
- **`releaseCommand` reports success even when it fails.** Never trust a deploy to have
  run migrations. Apply schema changes deliberately and verify.
- **Passport RSA keys** come from env vars, written to disk in `AuthServiceProvider::boot()`
  so they survive Railway's ephemeral filesystem.

## Known structural gaps

Named plainly; each is addressed in `ADR-001`.

- No service layer for 2021 code — business logic lives in controllers
- No repository layer — Eloquent and raw SQL side by side
- No API Resources — response shapes are implicit in controller code
- No Form Requests — inline validation, some with empty rules
- Same controllers serve the Blade admin panel *and* the mobile API
- Haversine distance formula duplicated 16 times; tag-ranking query duplicated 4 times

<!-- TODO(james): the profile doesn't cover these — fill in or delete:
     - Image storage: where do restaurant photos physically live? (S3? local disk? Foursquare CDN?)
     - Queue driver in production: Redis on Railway, or sync?
     - Backup/restore procedure for Supabase
     - Rate limits beyond the 5/min on auth endpoints -->
