# Metrics & KPI Definitions

> Updated 2026-06-09 · every number on /admin must have a row here

## KPI counts (header strip)

| Metric | Definition | Source |
|--------|------------|--------|
| total_users | rows in `users` where `deleted_at IS NULL` | Supabase count |
| total_restaurants | rows in `restaurants` where `deleted_at IS NULL` | Supabase count |
| total_tags | rows in `tags` where `deleted_at IS NULL` | Supabase count |
| total_saves | rows in `restaurant_user` | Supabase count |
| total_tag_applications | rows in `restaurant_tag` (one per user+restaurant+tag = one vote) | Supabase count |
| total_lists | rows in `testmaker_list` | Supabase count |

## Weekly trends (12 bars per metric)

Bucket = trailing 7-day windows ending now (bar 12 = last 7 days, bar 1 = 78–84
days ago). Counted by `created_at`. Computed in `src/lib/trends.ts#bucketByWeek`.
Caveat: source queries fetch at most ~1000 rows per table per 84-day window
(Supabase row cap) — migrate to a Postgres RPC when any table exceeds that.
User and restaurant trend counts exclude soft-deleted rows, matching their KPI definitions.

## Trending cities

Score = new restaurants + tag applications + saves in the **last 30 days**,
grouped by `restaurants.city` (tags/saves attribute to their restaurant's city).
Delta = score vs the **prior** 30-day window. Top 8 shown. Null/empty city
excluded. Metro-area rollup: deferred. Computed in `src/lib/city-stats.ts`.

## Web analytics (PostHog, project 455919)

Pageviews = `$pageview` events, last 7 days. Visitors = `count(DISTINCT person_id)`
over the same window. HogQL via `POSTHOG_PERSONAL_API_KEY`, cached 5 min.
GA4 (G-062TFF0ZGE) is the cross-check source — not queried by the dashboard.

## Activity feed

Latest 10 of: signups (`users.created_at`), tag applications
(`restaurant_tag.created_at`), lists (`testmaker_list.created_at`), merged and
sorted desc. Computed in `src/lib/activity-feed.ts`.
