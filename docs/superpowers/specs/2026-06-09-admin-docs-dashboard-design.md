# Admin Docs Reorganization + Landing Dashboard — Design

**Date:** 2026-06-09
**Repo:** tastemakers-web
**Status:** Approved pending user review

## Problem

1. `/admin/docs` is broken and disorganized. The index (`docs/page.tsx`) and the
   viewer (`docs/[id]/page.tsx`) each carry their own hardcoded `DOCS` array and
   they have drifted: 5 of 9 index entries 404 in the viewer, and 2 viewer docs
   (`going-live`, `blockers`) are unreachable from the index. Sizes, dates, and
   item counts are hardcoded and stale (May 8).
2. Operational knowledge (deploy process, incident triage, env-var inventory,
   architecture, KPI definitions) exists only in scattered CLAUDE.md fragments —
   nothing a DevOps manager or PM would recognize as a doc set.
3. `/admin` landing page shows static KPI counts but no trends, no geography,
   no web analytics, no unified activity stream.

## Section 1 — Docs reorganization

### Single registry (fixes the desync class of bug)

Move the doc list into `src/lib/docs.ts`:

```ts
export type DocCategory = "planning" | "operations" | "product" | "reference" | "context";

export type DocEntry = {
  id: string;
  title: string;
  category: DocCategory;
  source: DocSource; // existing local | github union
};

export const DOCS_REGISTRY: DocEntry[] = [ ... ];
```

Consumed by: index page (grouped listing), viewer sidebar, `generateStaticParams`,
and the viewer's `notFound()` check. No other doc list may exist anywhere.

### Registry contents

| Category | id | Title | Source |
|---|---|---|---|
| planning | `going-live` | Going-Live Runbook | local `src/content/docs/going-live.md` |
| planning | `cross-todos` | Cross-Project Todos | local `src/content/docs/cross-todos.md` |
| operations | `operations` | Operations Runbook | local `src/content/docs/operations.md` **(new)** |
| operations | `architecture` | System Architecture | local `src/content/docs/architecture.md` **(new)** |
| product | `metrics` | Metrics & KPI Definitions | local `src/content/docs/metrics.md` **(new)** |
| reference | `master-ports` | MASTER-PORTS.md | github `thirstypig/tastemakers-backend` `MASTER-PORTS.md` |
| reference | `backend-readme` | Backend README | github `thirstypig/tastemakers-backend` `README.md` |
| context | `root-claude` | Root — CLAUDE.md | local `src/content/docs/root-claude.md` (copy; root dir is not a git repo) |
| context | `backend-claude` | Backend — CLAUDE.md | github `thirstypig/tastemakers-backend` `CLAUDE.md` |
| context | `web-claude` | Web — CLAUDE.md | github `thirstypig/tastemakers-web` `CLAUDE.md` |
| context | `ios-claude` | iOS — CLAUDE.md | github `thirstypig/tastemakers-ios` `CLAUDE.md` (branch `master`) |
| context | `android-claude` | Android — CLAUDE.md | github `thirstypig/tastemakers-android` `CLAUDE.md` |
| context | `backend-todos` | Backend Todos | github `thirstypig/tastemakers-backend` `todos/README.md` |

Removed: `blockers` (merged into going-live), hardcoded sizes/dates/counts.

### Index page changes

- Render registry grouped by category with section headers
  (`# planning`, `# operations`, …), same terminal table style, `--tm-*` vars only.
- Columns: FILE · REPO/SOURCE · SOURCE BADGE (`live·github` / `local`) · UPDATED.
- UPDATED is computed: `fs.statSync().mtime` for local files; latest commit date
  via existing `fetchCommits()` for GitHub files (cached 5 min, falls back to
  `—` on API failure). No hardcoded metadata anywhere.

### Viewer changes

- Sidebar reads `DOCS_REGISTRY`, grouped by category with small category labels.
- Everything else (marked renderer, layout) unchanged.

### Content work

1. **`going-live.md`** — refresh to current reality (API + web live, iOS pending,
   marketing 502 check, Foursquare key, debug routes removal) and absorb
   `blockers.md` as a top "Current blockers" section. Delete `blockers.md`.
2. **`cross-todos.md`** — regenerate from `tastemakers/todos/` (current counts).
3. **`operations.md`** (new) — sections: Deploy (per-service Railway flow, GitHub
   auto-deploy, `releaseCommand` caveat, `/run-schema-fix` flow, PHP 8.1 pin),
   Rollback (Railway redeploy previous build), Incident triage (ordered checklist:
   status page → Railway logs → Supabase → env keys → DNS; known failure modes:
   502, OAuth login loop, missing FOURSQUARE_API_KEY), Environment inventory
   (env var *names* per service — **never values**).
4. **`architecture.md`** (new) — 5 repos, 3 Railway services + Supabase, domain/DNS
   map (Squarespace NS), auth flows (Passport for API, Supabase OAuth for admin),
   data flow client→API→Supabase. ASCII diagram acceptable.
5. **`metrics.md`** (new) — definition + exact source query for every number the
   dashboard shows: KPI counts, weekly trend buckets, "trending city" formula,
   PostHog pageviews/visitors. One table per dashboard block.
6. **`root-claude.md`** — copy of root CLAUDE.md.

### Maintenance loop

Update the `/doc` skill checklist: refresh `going-live.md`, `cross-todos.md`,
`root-claude.md`, and touch `operations.md`/`metrics.md` when infra or KPIs change.

## Section 2 — `/admin` landing dashboard

Keeps KPI strip and platform status. Replaces "recent users" table with the
activity feed. Adds four blocks:

1. **Trend graphs** — 12 weekly buckets each for new users, new restaurants, tag
   applications, saves. Fetch `created_at` from Supabase; bucket in pure
   `src/lib/trends.ts` (`bucketByWeek(dates, weeks): number[]`). Render as inline
   SVG/CSS bars in `--tm-*` colors. No chart library. Move to a Postgres RPC only
   if row counts pass ~50k.
2. **City leaderboard** — top 8 cities by activity score (new restaurants + tag
   applications + saves, last 30d) with ▲/▼ delta vs prior 30d. Tag/save rows join
   to `restaurants.city`. Aggregation in pure `src/lib/city-stats.ts`. Null/empty
   city → bucket "unknown", excluded from top-8 display. Metro mapping deferred.
3. **Web analytics strip** — pageviews + unique visitors, 7d, server-side PostHog
   query reusing the exact pattern from `admin/analytics/page.tsx`
   (`POSTHOG_PERSONAL_API_KEY`, project 455919). Renders "key missing" note when unset.
4. **Activity feed** — merge latest signups, tag applications, list creations into
   one stream sorted desc by timestamp, top 10. Merge logic in pure
   `src/lib/activity-feed.ts`.

### Error handling

All dashboard blocks fetch via `Promise.allSettled`; a failed query renders that
card's inline error state (`--tm-err`), never blanks the page. GitHub/PostHog
fetches already degrade gracefully (cached / fallback note).

### Testing

- `src/lib/docs.test.ts` — extend: registry ids unique, every id resolves, local
  source files exist on disk.
- `src/lib/trends.test.ts` — week bucketing incl. empty input, timezone edges.
- `src/lib/city-stats.test.ts` — scoring, delta, null-city handling.
- `src/lib/activity-feed.test.ts` — merge/sort/limit.
- Pattern per project convention: pure functions in `src/lib/`, node environment,
  no jsdom.

## Out of scope

- Metro-area mapping (city-level only this pass)
- Generating routes.json from `routes/api.php` (separate todo)
- Any sidebar nav changes (roadmap/todo/changelog/routes/tech/analytics/status pages unchanged)
- Auth, public pages, other repos

## Rollout

Feature branch `feat/admin-docs-dashboard` → PR → merge → Railway auto-deploy.
Dashboard pages to update post-implementation per house rule: /tech, /roadmap,
/changelog, /analytics, admin changelog + todo.
