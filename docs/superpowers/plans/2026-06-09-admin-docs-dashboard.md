---
id: DOC-021
type: note
status: done
phase: null
owner: james
tags: [web]
links: [DOC-022]
updated: 2026-06-09
---

# Admin Docs Reorg + Landing Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken `/admin/docs` section with a single doc registry + curated ops doc set, and turn `/admin` into a real dashboard (trends, city leaderboard, PostHog stats, activity feed).

**Architecture:** One `DOCS_REGISTRY` in `src/lib/docs.ts` feeds the docs index, viewer, and static params. All dashboard aggregation logic is pure functions in `src/lib/` (node-env vitest, no jsdom). Dashboard blocks fetch independently via `Promise.allSettled` so one failure never blanks the page. No FK embeds in Supabase queries (legacy DB has no FK constraints) — joins happen in JS via Maps.

**Tech Stack:** Next.js 15 App Router (server components), Supabase JS (`createAdminClient` from `@/lib/supabase-admin`), PostHog HogQL API, vitest. No new dependencies.

**Branch:** `feat/admin-docs-dashboard` (already exists, spec committed).
**Working dir:** `/Users/jameschang/Projects/tastemakers/tastemakers-web`
**Run tests:** `npx vitest run` · **Type check:** `npm run type-check`

---

## Part A — Docs reorganization

### Task 1: Single doc registry in `src/lib/docs.ts`

**Files:**
- Modify: `src/lib/docs.ts`
- Test: `src/lib/docs.test.ts` (extend existing file)

- [ ] **Step 1: Write failing tests** — append to `src/lib/docs.test.ts` (ensure the file's vitest import includes `vi`: `import { describe, it, expect, vi } from "vitest"`):

```ts
import { DOCS_REGISTRY, DOC_CATEGORIES, getDoc, fetchDocUpdated } from "./docs";
import fs from "fs";
import path from "path";

describe("DOCS_REGISTRY", () => {
  it("has unique ids", () => {
    const ids = DOCS_REGISTRY.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every entry has a category defined in DOC_CATEGORIES", () => {
    const cats = DOC_CATEGORIES.map((c) => c.id);
    for (const d of DOCS_REGISTRY) expect(cats).toContain(d.category);
  });

  it("every local source file exists on disk", () => {
    for (const d of DOCS_REGISTRY) {
      if (d.source.type === "local") {
        expect(
          fs.existsSync(path.join(process.cwd(), d.source.file)),
          `${d.id} → ${d.source.file}`,
        ).toBe(true);
      }
    }
  });

  it("getDoc resolves every registry id and rejects unknown ids", () => {
    for (const d of DOCS_REGISTRY) expect(getDoc(d.id)?.id).toBe(d.id);
    expect(getDoc("nope")).toBeUndefined();
  });
});

describe("fetchDocUpdated", () => {
  it("returns mtime date for local files", async () => {
    const date = await fetchDocUpdated({ type: "local", file: "package.json" });
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns latest commit date for github files", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ commit: { author: { date: "2026-06-01T10:00:00Z" } } }],
    });
    vi.stubGlobal("fetch", mockFetch);
    const date = await fetchDocUpdated({
      type: "github", repo: "thirstypig/tastemakers-backend", branch: "main", file: "CLAUDE.md",
    });
    expect(date).toBe("2026-06-01");
    expect(mockFetch.mock.lastCall![0]).toContain("path=CLAUDE.md");
    vi.unstubAllGlobals();
  });

  it("returns null when github fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const date = await fetchDocUpdated({
      type: "github", repo: "x/y", branch: "main", file: "z.md",
    });
    expect(date).toBeNull();
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run src/lib/docs.test.ts`
Expected: FAIL — `DOCS_REGISTRY` etc. not exported. (Local-file test will also fail until Tasks 2–6 create the content files — that is expected; re-run after Task 6.)

- [ ] **Step 3: Implement** — append to `src/lib/docs.ts` (keep existing `DocSource` + `fetchMarkdown` unchanged):

```ts
export type DocCategory = "planning" | "operations" | "product" | "reference" | "context";

export type DocEntry = {
  id: string;
  title: string;
  category: DocCategory;
  source: DocSource;
};

export const DOC_CATEGORIES: { id: DocCategory; label: string }[] = [
  { id: "planning", label: "planning" },
  { id: "operations", label: "operations" },
  { id: "product", label: "product" },
  { id: "reference", label: "reference" },
  { id: "context", label: "context" },
];

const BACKEND = "thirstypig/tastemakers-backend";

export const DOCS_REGISTRY: DocEntry[] = [
  { id: "going-live", title: "Going-Live Runbook", category: "planning",
    source: { type: "local", file: "src/content/docs/going-live.md" } },
  { id: "cross-todos", title: "Cross-Project Todos", category: "planning",
    source: { type: "local", file: "src/content/docs/cross-todos.md" } },
  { id: "operations", title: "Operations Runbook", category: "operations",
    source: { type: "local", file: "src/content/docs/operations.md" } },
  { id: "architecture", title: "System Architecture", category: "operations",
    source: { type: "local", file: "src/content/docs/architecture.md" } },
  { id: "metrics", title: "Metrics & KPI Definitions", category: "product",
    source: { type: "local", file: "src/content/docs/metrics.md" } },
  { id: "master-ports", title: "MASTER-PORTS.md", category: "reference",
    source: { type: "github", repo: BACKEND, branch: "main", file: "MASTER-PORTS.md" } },
  { id: "backend-readme", title: "Backend README", category: "reference",
    source: { type: "github", repo: BACKEND, branch: "main", file: "README.md" } },
  { id: "root-claude", title: "Root — CLAUDE.md", category: "context",
    source: { type: "local", file: "src/content/docs/root-claude.md" } },
  { id: "backend-claude", title: "Backend — CLAUDE.md", category: "context",
    source: { type: "github", repo: BACKEND, branch: "main", file: "CLAUDE.md" } },
  { id: "web-claude", title: "Web — CLAUDE.md", category: "context",
    source: { type: "github", repo: "thirstypig/tastemakers-web", branch: "main", file: "CLAUDE.md" } },
  { id: "ios-claude", title: "iOS — CLAUDE.md", category: "context",
    source: { type: "github", repo: "thirstypig/tastemakers-ios", branch: "master", file: "CLAUDE.md" } },
  { id: "android-claude", title: "Android — CLAUDE.md", category: "context",
    source: { type: "github", repo: "thirstypig/tastemakers-android", branch: "main", file: "CLAUDE.md" } },
  { id: "backend-todos", title: "Backend Todos", category: "context",
    source: { type: "github", repo: BACKEND, branch: "main", file: "todos/README.md" } },
];

export function getDoc(id: string): DocEntry | undefined {
  return DOCS_REGISTRY.find((d) => d.id === id);
}

export async function fetchDocUpdated(source: DocSource): Promise<string | null> {
  if (source.type === "local") {
    try {
      return fs.statSync(path.join(process.cwd(), source.file)).mtime.toISOString().slice(0, 10);
    } catch {
      return null;
    }
  }
  try {
    const url = `https://api.github.com/repos/${source.repo}/commits?path=${encodeURIComponent(source.file)}&sha=${source.branch}&per_page=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 300 },
    } as RequestInit);
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.[0]?.commit?.author?.date as string | undefined)?.slice(0, 10) ?? null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests** — `npx vitest run src/lib/docs.test.ts`
Expected: all PASS except "every local source file exists" (5 content files don't exist yet — created in Tasks 2–6).

- [ ] **Step 5: Commit**

```bash
git add src/lib/docs.ts src/lib/docs.test.ts
git commit -m "feat: single DOCS_REGISTRY + computed updated-dates in lib/docs"
```

### Task 2: Refresh `going-live.md`, absorb and delete `blockers.md`

**Files:**
- Modify: `src/content/docs/going-live.md` (full rewrite)
- Delete: `src/content/docs/blockers.md`

- [ ] **Step 1:** Read current `src/content/docs/going-live.md` and `blockers.md` for any still-relevant items, then overwrite `going-live.md` with the structure below. Verify each claim against the repos before writing (e.g. confirm debug routes still exist in `tastemakers-backend/routes/web.php`):

```markdown
# Going-Live Runbook

> Updated 2026-06-09 · maintained by the /doc skill · canonical home: tastemakers-web

## Current blockers

| # | Blocker | Impact | Owner action |
|---|---------|--------|--------------|
| 1 | `FOURSQUARE_API_KEY` missing in Railway | `/api/restaurants` fails in prod | Add key in Railway → backend service vars |
| 2 | Debug routes live in prod (`/debug-schema`, `/run-schema-fix`, `/debug-signup`) | Security exposure | Remove from `routes/web.php`, deploy |
| 3 | Marketing site status unknown (502 last checked 2026-05-11) | www domain may be down | Check Railway service + Caddyfile |
| 4 | iOS still points at Namecheap URL | Old API serves iOS users | Update Constant.swift → App Store submission |

## Launch sequence (remaining)

1. Fix blockers 1–3 above
2. Update iOS `Constant.swift` base URL → `api.tastemakersapp.com` → TestFlight → App Store review
3. Keep legacy `tastemakersapp.com/v2/api/` responding until iOS adoption > 90% (assume months)
4. Cancel Namecheap hosting (keep domain registration)

## Done

- ✅ Laravel API live on Railway (`api.tastemakersapp.com`)
- ✅ Supabase live, 22 tables
- ✅ Web app + admin live (`app.tastemakersapp.com`), Google OAuth working
- ✅ DNS: Squarespace nameservers, api/app/www CNAMEs configured
```

- [ ] **Step 2:** `rm src/content/docs/blockers.md`

- [ ] **Step 3: Commit**

```bash
git add -A src/content/docs/
git commit -m "docs: refresh going-live runbook, merge in blockers.md"
```

### Task 3: Regenerate `cross-todos.md` and `root-claude.md` from root sources

**Files:**
- Modify: `src/content/docs/cross-todos.md`
- Create: `src/content/docs/root-claude.md`

- [ ] **Step 1:** Copy with provenance headers (root dir is not a git repo, so these are maintained snapshots):

```bash
{ echo "> Snapshot of tastemakers/todos/README.md · refreshed 2026-06-09 by /doc skill"; echo; cat ../todos/README.md; } > src/content/docs/cross-todos.md
{ echo "> Snapshot of tastemakers/CLAUDE.md · refreshed 2026-06-09 by /doc skill"; echo; cat ../CLAUDE.md; } > src/content/docs/root-claude.md
```

- [ ] **Step 2:** Open both outputs and sanity-check they rendered (no binary garbage, headings intact).

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/cross-todos.md src/content/docs/root-claude.md
git commit -m "docs: regenerate cross-todos + add root CLAUDE.md snapshot"
```

### Task 4: Write `operations.md`

**Files:**
- Create: `src/content/docs/operations.md`

- [ ] **Step 1:** Create the file. Verify env-var names against Railway service settings / `.env.example` files where possible; list **names only, never values**:

```markdown
# Operations Runbook

> Updated 2026-06-09 · names only — never put secret values in this doc

## Deploy

All three services deploy via **Railway GitHub auto-deploy** on push to `main`
(project `c6fd4935-ffeb-4cd9-9185-81a941bcb6c7`).

| Service | Repo | Runtime | Domain |
|---------|------|---------|--------|
| API | tastemakers-backend | PHP **8.1 (pinned — Laravel 8 breaks on 8.4)** | api.tastemakersapp.com |
| Web | tastemakers-web | Node / Next.js 15, internal PORT=8080 | app.tastemakersapp.com |
| Marketing | tastemakers-marketing | Caddy static | www.tastemakersapp.com |

**Gotchas (learned the hard way):**
- `releaseCommand` in `railway.json` reports SUCCESS even when migrations fail.
  Schema changes go through the `/run-schema-fix` HTTP endpoint after deploy,
  not `php artisan migrate` in the release command.
- Inside web server code, `request.url` is `http://localhost:8080/...` — never
  build redirect origins from it; use `NEXT_PUBLIC_SITE_URL`.
- Passport RSA keys are env vars written to disk in `AuthServiceProvider::boot()`
  (survives Railway's ephemeral filesystem).

## Rollback

Railway dashboard → service → Deployments → previous successful deploy → **Redeploy**.
DB schema rollbacks are manual (Supabase SQL editor) — migrations table may be
out of sync with reality; check `SELECT * FROM migrations ORDER BY batch DESC LIMIT 10`.

## Incident triage (in order)

1. `/admin/status` — which service is red?
2. Railway → service → Logs (build vs deploy vs runtime)
3. Supabase dashboard → DB health / connection count
4. Env keys: known-missing list below — a 500 on one endpoint often = missing key
5. DNS: `dig api.tastemakersapp.com +short` (Squarespace is the NS authority)

**Known failure modes:**
- `/api/restaurants` 500 → `FOURSQUARE_API_KEY` missing
- Admin login loop, no error param → `ADMIN_EMAILS` typo (must exactly match Google email)
- Marketing 502 → Caddy container crashed or PORT mismatch
- OAuth redirect to localhost:8080 → someone used `request.url` origin (see Deploy gotchas)

## Environment inventory (names only)

| Service | Required vars |
|---------|---------------|
| API | DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD, PASSPORT_PRIVATE_KEY, PASSPORT_PUBLIC_KEY, FOURSQUARE_API_KEY ⚠️ missing, FCM_SERVER_KEY ⚠️ missing, Apple Sign-In keys ⚠️ missing |
| Web | NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS, NEXT_PUBLIC_POSTHOG_KEY, POSTHOG_PERSONAL_API_KEY, GITHUB_TOKEN (optional) |
| Marketing | none (static) |

## Local dev ports

Web 3050 · API 4050 · Admin/Swagger 4051 · Postgres 5446 · Redis 6384.
Full registry: MASTER-PORTS.md (reference docs).
```

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/operations.md
git commit -m "docs: add operations runbook (deploy/rollback/incident/env inventory)"
```

### Task 5: Write `architecture.md`

**Files:**
- Create: `src/content/docs/architecture.md`

- [ ] **Step 1:** Create:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add src/content/docs/architecture.md
git commit -m "docs: add system architecture overview"
```

### Task 6: Write `metrics.md`

**Files:**
- Create: `src/content/docs/metrics.md`

- [ ] **Step 1:** Create (this documents exactly what the Part B dashboard computes — keep the two in sync):

```markdown
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
```

- [ ] **Step 2: Run** `npx vitest run src/lib/docs.test.ts` — the "local source file exists" test must now PASS (all 5 local files exist).

- [ ] **Step 3: Commit**

```bash
git add src/content/docs/metrics.md
git commit -m "docs: add metrics/KPI definitions"
```

### Task 7: Rewrite docs index page from the registry

**Files:**
- Modify: `src/app/admin/docs/page.tsx` (full rewrite)

- [ ] **Step 1:** Replace the file. Keep the tab strip and `TRow` exactly as they are today; replace the hardcoded `DOCS` array and flat table with registry-driven grouped sections:

```tsx
import Link from "next/link";
import { DOCS_REGISTRY, DOC_CATEGORIES, fetchDocUpdated, type DocEntry } from "@/lib/docs";

function sourceLabel(d: DocEntry): { repo: string; badge: string; badgeColor: string } {
  if (d.source.type === "github")
    return { repo: d.source.repo.replace("thirstypig/", ""), badge: "live·github", badgeColor: "var(--tm-accent)" };
  return { repo: "tastemakers-web", badge: "local", badgeColor: "var(--tm-muted)" };
}

export default async function DocsPage() {
  const updated = await Promise.all(
    DOCS_REGISTRY.map((d) => fetchDocUpdated(d.source).catch(() => null)),
  );
  const updatedById = new Map(DOCS_REGISTRY.map((d, i) => [d.id, updated[i]]));

  return (
    <div>
      {/* Tab strip — unchanged from current file */}
      {/* ... keep existing tab strip JSX ... */}
      <div style={{ padding: "14px 18px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
        <div style={{ color: "var(--tm-muted)", marginBottom: 14, fontSize: 11.5 }}>
          <span style={{ color: "var(--tm-accent)" }}>$</span> ls docs/ --group-by category
        </div>
        {DOC_CATEGORIES.map((cat) => {
          const docs = DOCS_REGISTRY.filter((d) => d.category === cat.id);
          if (docs.length === 0) return null;
          return (
            <div key={cat.id} style={{ marginBottom: 18 }}>
              <div style={{ color: "var(--tm-muted)", marginBottom: 6, fontSize: 12 }}>
                # {cat.label} · {docs.length}
              </div>
              <div style={{ background: "var(--tm-panel)", border: "1px solid var(--tm-line)", borderRadius: 6 }}>
                {docs.map((doc, i) => {
                  const s = sourceLabel(doc);
                  return (
                    <Link key={doc.id} href={`/admin/docs/${doc.id}`} style={{ textDecoration: "none", display: "block" }}>
                      <TRow last={i === docs.length - 1}>
                        <span style={{ flex: 1, color: "var(--tm-accent)" }}>→ {doc.title}</span>
                        <span style={{ width: 180, color: "var(--tm-muted)" }}>{s.repo}</span>
                        <span style={{ width: 100, color: s.badgeColor }}>{s.badge}</span>
                        <span style={{ width: 90, color: "var(--tm-muted)" }}>{updatedById.get(doc.id) ?? "—"}</span>
                      </TRow>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

(`TRow` stays as defined in the current file; add a header row per group only if it reads better — optional.)

- [ ] **Step 2:** `npm run type-check` — expect PASS.
- [ ] **Step 3:** Manual check: `http://localhost:3050/admin/docs` shows 5 grouped sections, 13 docs, updated dates populated (github ones may show `—` if rate-limited — acceptable).
- [ ] **Step 4: Commit**

```bash
git add src/app/admin/docs/page.tsx
git commit -m "feat: docs index driven by DOCS_REGISTRY, grouped by category"
```

### Task 8: Point the doc viewer at the registry

**Files:**
- Modify: `src/app/admin/docs/[id]/page.tsx`

- [ ] **Step 1:** Delete the local `DOCS` array and `DocMeta` type. Import instead:

```tsx
import { DOCS_REGISTRY, DOC_CATEGORIES, getDoc } from "@/lib/docs";
```

Replace `const doc = DOCS.find(...)` with `const doc = getDoc(id);` and `DOCS.map` in `generateStaticParams` with `DOCS_REGISTRY.map`. Rebuild the sidebar to group by category:

```tsx
{DOC_CATEGORIES.map((cat) => {
  const docs = DOCS_REGISTRY.filter((d) => d.category === cat.id);
  if (docs.length === 0) return null;
  return (
    <div key={cat.id}>
      <div style={{ padding: "10px 16px 4px", fontSize: 10, color: t.dim, textTransform: "uppercase", letterSpacing: 1 }}>
        {cat.label}
      </div>
      {docs.map((d) => (
        <a key={d.id} href={`/admin/docs/${d.id}`} style={{ /* keep existing active/inactive link styles */ }}>
          {d.title}
        </a>
      ))}
    </div>
  );
})}
```

- [ ] **Step 2:** `npm run type-check` — PASS. Then manually click through **all 13 docs** from the index — zero 404s, GitHub docs render markdown, local docs render markdown.
- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/docs/[id]/page.tsx"
git commit -m "fix: doc viewer reads DOCS_REGISTRY — kills index/viewer desync 404s"
```

### Task 9: Add doc refresh to the /doc skill checklist

**Files:**
- Modify: `/Users/jameschang/Projects/tastemakers/.claude/skills/doc/SKILL.md` (find the checklist section; if file layout differs, locate the doc skill under `.claude/skills/`)

- [ ] **Step 1:** Add to the skill's update checklist:

```markdown
- Admin docs content (tastemakers-web/src/content/docs/): refresh `going-live.md`
  (blockers + launch sequence), regenerate `cross-todos.md` from todos/README.md,
  re-copy `root-claude.md` from root CLAUDE.md, and touch `operations.md` /
  `metrics.md` if infra or KPI definitions changed.
```

- [ ] **Step 2:** No commit in web repo (root folder is not a git repo — file change only).

---

## Part B — Landing dashboard

### Task 10: `src/lib/trends.ts` — weekly bucketing

**Files:**
- Create: `src/lib/trends.ts`
- Test: `src/lib/trends.test.ts`

- [ ] **Step 1: Write failing tests**:

```ts
import { describe, it, expect } from "vitest";
import { bucketByWeek } from "./trends";

const NOW = new Date("2026-06-09T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();

describe("bucketByWeek", () => {
  it("returns `weeks` zero-filled buckets for empty input", () => {
    expect(bucketByWeek([], 12, NOW)).toEqual(new Array(12).fill(0));
  });

  it("puts a date from the last 7 days in the final bucket", () => {
    const b = bucketByWeek([daysAgo(2)], 12, NOW);
    expect(b[11]).toBe(1);
    expect(b.reduce((a, x) => a + x, 0)).toBe(1);
  });

  it("puts a date 8 days ago in the second-to-last bucket", () => {
    expect(bucketByWeek([daysAgo(8)], 12, NOW)[10]).toBe(1);
  });

  it("ignores dates older than the window, in the future, or invalid", () => {
    const b = bucketByWeek([daysAgo(85), daysAgo(-1), "not-a-date"], 12, NOW);
    expect(b.reduce((a, x) => a + x, 0)).toBe(0);
  });

  it("counts multiple dates in the same bucket", () => {
    expect(bucketByWeek([daysAgo(1), daysAgo(3), daysAgo(6)], 12, NOW)[11]).toBe(3);
  });
});
```

- [ ] **Step 2:** Run `npx vitest run src/lib/trends.test.ts` — FAIL (module missing).
- [ ] **Step 3: Implement**:

```ts
const WEEK_MS = 7 * 86400000;

/** Counts dates into `weeks` trailing 7-day buckets ending at `now`.
 *  Index weeks-1 = the most recent 7 days; index 0 = the oldest week. */
export function bucketByWeek(dates: string[], weeks: number, now: Date): number[] {
  const counts = new Array<number>(weeks).fill(0);
  const end = now.getTime();
  for (const d of dates) {
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) continue;
    const diff = end - t;
    if (diff < 0 || diff >= weeks * WEEK_MS) continue;
    counts[weeks - 1 - Math.floor(diff / WEEK_MS)]++;
  }
  return counts;
}
```

- [ ] **Step 4:** `npx vitest run src/lib/trends.test.ts` — PASS.
- [ ] **Step 5: Commit** — `git add src/lib/trends.ts src/lib/trends.test.ts && git commit -m "feat: weekly trend bucketing lib"`

### Task 11: `src/lib/city-stats.ts` — city leaderboard

**Files:**
- Create: `src/lib/city-stats.ts`
- Test: `src/lib/city-stats.test.ts`

- [ ] **Step 1: Write failing tests**:

```ts
import { describe, it, expect } from "vitest";
import { cityLeaderboard, type CityEvent } from "./city-stats";

const NOW = new Date("2026-06-09T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();
const ev = (city: string | null, n: number): CityEvent => ({ city, createdAt: daysAgo(n) });

describe("cityLeaderboard", () => {
  it("scores current-window events and ranks desc", () => {
    const out = cityLeaderboard([ev("LA", 1), ev("LA", 5), ev("NY", 2)], NOW);
    expect(out[0]).toMatchObject({ city: "LA", current: 2 });
    expect(out[1]).toMatchObject({ city: "NY", current: 1 });
  });

  it("computes delta vs the prior 30-day window", () => {
    const out = cityLeaderboard([ev("LA", 1), ev("LA", 40), ev("LA", 45)], NOW);
    expect(out[0]).toMatchObject({ current: 1, previous: 2, delta: -1 });
  });

  it("excludes null/empty cities and trims whitespace", () => {
    const out = cityLeaderboard([ev(null, 1), ev("  ", 2), ev(" LA ", 3)], NOW);
    expect(out).toHaveLength(1);
    expect(out[0].city).toBe("LA");
  });

  it("ignores events older than 60 days and caps at `top`", () => {
    const events = ["A", "B", "C"].map((c) => ev(c, 1)).concat([ev("Z", 70)]);
    const out = cityLeaderboard(events, NOW, 30, 2);
    expect(out).toHaveLength(2);
    expect(out.find((s) => s.city === "Z")).toBeUndefined();
  });
});
```

- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3: Implement**:

```ts
export type CityEvent = { city: string | null; createdAt: string };
export type CityStat = { city: string; current: number; previous: number; delta: number };

/** Ranks cities by event count in the trailing `windowDays`; delta vs the prior window. */
export function cityLeaderboard(
  events: CityEvent[],
  now: Date,
  windowDays = 30,
  top = 8,
): CityStat[] {
  const windowMs = windowDays * 86400000;
  const end = now.getTime();
  const stats = new Map<string, { current: number; previous: number }>();
  for (const e of events) {
    const city = e.city?.trim();
    if (!city) continue;
    const t = new Date(e.createdAt).getTime();
    if (Number.isNaN(t)) continue;
    const diff = end - t;
    if (diff < 0 || diff >= 2 * windowMs) continue;
    const s = stats.get(city) ?? { current: 0, previous: 0 };
    if (diff < windowMs) s.current++;
    else s.previous++;
    stats.set(city, s);
  }
  return [...stats.entries()]
    .map(([city, s]) => ({ city, ...s, delta: s.current - s.previous }))
    .filter((s) => s.current > 0)
    .sort((a, b) => b.current - a.current || a.city.localeCompare(b.city))
    .slice(0, top);
}
```

- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5: Commit** — `git add src/lib/city-stats.* && git commit -m "feat: city leaderboard aggregation lib"`

### Task 12: `src/lib/activity-feed.ts` — merged feed

**Files:**
- Create: `src/lib/activity-feed.ts`
- Test: `src/lib/activity-feed.test.ts`

- [ ] **Step 1: Write failing tests**:

```ts
import { describe, it, expect } from "vitest";
import { mergeFeed, type FeedItem } from "./activity-feed";

const item = (type: FeedItem["type"], createdAt: string, label = "x"): FeedItem =>
  ({ type, label, createdAt });

describe("mergeFeed", () => {
  it("sorts descending by createdAt across types", () => {
    const out = mergeFeed([
      item("signup", "2026-06-01T00:00:00Z"),
      item("list", "2026-06-03T00:00:00Z"),
      item("tag", "2026-06-02T00:00:00Z"),
    ]);
    expect(out.map((i) => i.type)).toEqual(["list", "tag", "signup"]);
  });

  it("limits output", () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      item("signup", `2026-05-${String(i + 1).padStart(2, "0")}T00:00:00Z`));
    expect(mergeFeed(items, 10)).toHaveLength(10);
  });

  it("drops items with invalid dates", () => {
    expect(mergeFeed([item("signup", "garbage"), item("tag", "2026-06-01T00:00:00Z")]))
      .toHaveLength(1);
  });
});
```

- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3: Implement**:

```ts
export type FeedItem = {
  type: "signup" | "tag" | "list";
  label: string;
  detail?: string;
  createdAt: string;
};

export function mergeFeed(items: FeedItem[], limit = 10): FeedItem[] {
  return items
    .filter((i) => !Number.isNaN(new Date(i.createdAt).getTime()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
```

- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5: Commit** — `git add src/lib/activity-feed.* && git commit -m "feat: activity feed merge lib"`

### Task 13: `src/lib/posthog.ts` — shared HogQL client + web stats

**Files:**
- Create: `src/lib/posthog.ts`
- Test: `src/lib/posthog.test.ts`
- Modify: `src/app/admin/analytics/page.tsx:10-35` (replace its private `fetchPostHogEvents` with the lib)

- [ ] **Step 1: Write failing tests** (mirror the mock pattern in `src/lib/github.test.ts` — `vi.stubGlobal("fetch", ...)`, assert on `mock.lastCall`):

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { posthogQuery, fetchWebStats } from "./posthog";

afterEach(() => vi.unstubAllGlobals());

describe("posthogQuery", () => {
  it("POSTs HogQL with bearer auth and returns results", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [["a", 1]] }),
    });
    vi.stubGlobal("fetch", mockFetch);
    const out = await posthogQuery("key", "SELECT 1");
    expect(out).toEqual([["a", 1]]);
    const [url, init] = mockFetch.mock.lastCall!;
    expect(url).toContain("/api/projects/455919/query/");
    expect(init.headers.Authorization).toBe("Bearer key");
  });

  it("returns null on non-ok response and on throw", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await posthogQuery("key", "SELECT 1")).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net")));
    expect(await posthogQuery("key", "SELECT 1")).toBeNull();
  });
});

describe("fetchWebStats", () => {
  it("maps rows to day/views/visitors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ results: [["2026-06-08", 42, 7]] }),
    }));
    expect(await fetchWebStats("key")).toEqual([{ day: "2026-06-08", views: 42, visitors: 7 }]);
  });
});
```

- [ ] **Step 2:** Run — FAIL.
- [ ] **Step 3: Implement**:

```ts
const POSTHOG_HOST = "https://us.posthog.com";
const POSTHOG_PROJECT_ID = "455919";

export async function posthogQuery(
  apiKey: string,
  hogql: string,
): Promise<unknown[][] | null> {
  try {
    const res = await fetch(`${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql } }),
      next: { revalidate: 300 },
    } as RequestInit);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.results as unknown[][]) ?? null;
  } catch {
    return null;
  }
}

export type WebStatDay = { day: string; views: number; visitors: number };

export async function fetchWebStats(apiKey: string): Promise<WebStatDay[] | null> {
  const rows = await posthogQuery(
    apiKey,
    "SELECT toDate(timestamp) AS day, count(*) AS views, count(DISTINCT person_id) AS visitors " +
      "FROM events WHERE event = '$pageview' AND toDate(timestamp) >= today() - 7 " +
      "GROUP BY day ORDER BY day",
  );
  if (!rows) return null;
  return rows.map((r) => ({ day: String(r[0]), views: Number(r[1]), visitors: Number(r[2]) }));
}
```

- [ ] **Step 4:** Run — PASS.
- [ ] **Step 5:** In `src/app/admin/analytics/page.tsx`, delete the private `fetchPostHogEvents` (lines ~10–35) and replace its call site with:

```tsx
import { posthogQuery } from "@/lib/posthog";
// ...
const posthogEvents = posthogApiKey
  ? ((await posthogQuery(
      posthogApiKey,
      "SELECT event, count(*) AS total FROM events WHERE toDate(timestamp) >= today() - 7 " +
        "GROUP BY event ORDER BY total DESC LIMIT 15",
    )) as [string, number][] | null)
  : null;
```

- [ ] **Step 6:** `npm run type-check && npx vitest run` — all PASS.
- [ ] **Step 7: Commit** — `git add src/lib/posthog.* src/app/admin/analytics/page.tsx && git commit -m "feat: shared posthog HogQL lib + web stats query"`

### Task 14: Rebuild `/admin` as the dashboard

**Files:**
- Modify: `src/app/admin/page.tsx` (keep `getKpis`, `getTopTags`, `TRow`, tab strip; remove `getRecentUsers`)

- [ ] **Step 1:** Add data fetchers (top of file, after `getKpis`). Note the explicit row-cap comment — Supabase serves at most ~1000 rows per request, acceptable at current scale, RPC later (documented in metrics.md):

```tsx
import { bucketByWeek } from "@/lib/trends";
import { cityLeaderboard, type CityEvent } from "@/lib/city-stats";
import { mergeFeed, type FeedItem } from "@/lib/activity-feed";
import { fetchWebStats, type WebStatDay } from "@/lib/posthog";

const TREND_WEEKS = 12;

async function getTrends(now: Date) {
  const db = createAdminClient();
  const cutoff = new Date(now.getTime() - TREND_WEEKS * 7 * 86400000).toISOString();
  // Row cap: Supabase returns ≤1000 rows/request — fine at current volume (see metrics.md)
  const [users, restaurants, tags, saves] = await Promise.all([
    db.from("users").select("created_at").gte("created_at", cutoff).is("deleted_at", null),
    db.from("restaurants").select("created_at").gte("created_at", cutoff),
    db.from("restaurant_tag").select("created_at").gte("created_at", cutoff),
    db.from("restaurant_user").select("created_at").gte("created_at", cutoff),
  ]);
  const dates = (rows: { data: { created_at: string | null }[] | null }) =>
    (rows.data ?? []).map((r) => r.created_at ?? "");
  return {
    users: bucketByWeek(dates(users), TREND_WEEKS, now),
    restaurants: bucketByWeek(dates(restaurants), TREND_WEEKS, now),
    tags: bucketByWeek(dates(tags), TREND_WEEKS, now),
    saves: bucketByWeek(dates(saves), TREND_WEEKS, now),
  };
}

async function getCityStats(now: Date) {
  const db = createAdminClient();
  const cutoff = new Date(now.getTime() - 60 * 86400000).toISOString();
  const [restaurants, tagEvents, saveEvents] = await Promise.all([
    db.from("restaurants").select("id, city, created_at"),
    db.from("restaurant_tag").select("restaurant_id, created_at").gte("created_at", cutoff),
    db.from("restaurant_user").select("restaurant_id, created_at").gte("created_at", cutoff),
  ]);
  const cityById = new Map<number, string | null>(
    (restaurants.data ?? []).map((r) => [r.id as number, r.city as string | null]),
  );
  const events: CityEvent[] = [
    ...(restaurants.data ?? [])
      .filter((r) => r.created_at >= cutoff)
      .map((r) => ({ city: r.city as string | null, createdAt: r.created_at as string })),
    ...(tagEvents.data ?? []).map((e) => ({
      city: cityById.get(e.restaurant_id as number) ?? null,
      createdAt: e.created_at as string,
    })),
    ...(saveEvents.data ?? []).map((e) => ({
      city: cityById.get(e.restaurant_id as number) ?? null,
      createdAt: e.created_at as string,
    })),
  ];
  return cityLeaderboard(events, now);
}

async function getActivityFeed() {
  const db = createAdminClient();
  const [users, tagEvents, lists] = await Promise.all([
    db.from("users").select("first_name, last_name, email, created_at")
      .is("deleted_at", null).order("created_at", { ascending: false }).limit(10),
    db.from("restaurant_tag").select("created_at, tag_id")
      .order("created_at", { ascending: false }).limit(10),
    db.from("testmaker_list").select("list_name, created_at")
      .order("created_at", { ascending: false }).limit(10),
  ]);
  const tagIds = [...new Set((tagEvents.data ?? []).map((e) => e.tag_id as number))];
  const tagNames = tagIds.length
    ? await db.from("tags").select("id, name").in("id", tagIds)
    : { data: [] };
  const nameById = new Map((tagNames.data ?? []).map((t) => [t.id as number, t.name as string]));
  const items: FeedItem[] = [
    ...(users.data ?? []).map((u) => ({
      type: "signup" as const,
      label: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || (u.email as string),
      createdAt: u.created_at as string,
    })),
    ...(tagEvents.data ?? []).map((e) => ({
      type: "tag" as const,
      label: nameById.get(e.tag_id as number) ?? `tag #${e.tag_id}`,
      createdAt: e.created_at as string,
    })),
    ...(lists.data ?? []).map((l) => ({
      type: "list" as const,
      label: l.list_name as string,
      createdAt: l.created_at as string,
    })),
  ];
  return mergeFeed(items, 10);
}

const PLATFORMS = [
  { id: "ios", label: "ios", status: "live · App Store", color: "var(--tm-accent)" },
  { id: "android", label: "android", status: "in development", color: "var(--tm-warn)" },
  { id: "web", label: "web", status: "live · Railway", color: "var(--tm-accent)" },
  { id: "api", label: "api", status: "live · Railway", color: "var(--tm-accent)" },
];
```

- [ ] **Step 2:** Replace the page body's data loading with failure-isolated fetches:

```tsx
export default async function AdminOverview() {
  const now = new Date();
  const posthogKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const [kpisR, trendsR, citiesR, feedR, topTagsR, webStatsR] = await Promise.allSettled([
    getKpis(),
    getTrends(now),
    getCityStats(now),
    getActivityFeed(),
    getTopTags(),
    posthogKey ? fetchWebStats(posthogKey) : Promise.resolve(null),
  ]);
  const val = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;
  // each block below renders an inline error card when its value is null
```

- [ ] **Step 3:** Add a `Spark` bar component and render blocks in this order, all using the existing `TRow`/panel styles (`var(--tm-panel)` cards, `var(--tm-line)` borders, JetBrains Mono):

```tsx
function Spark({ values, color = "var(--tm-accent)" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 24 }}>
      {values.map((v, i) => (
        <span key={i} title={String(v)} style={{
          width: 6,
          height: Math.max(2, Math.round((v / max) * 24)),
          background: i === values.length - 1 ? color : `color-mix(in srgb, ${color} 55%, transparent)`,
          borderRadius: 1,
        }} />
      ))}
    </span>
  );
}
```

Blocks (each its own `# heading` section like the current page):
1. `# kpis · live` — existing KPI rows (unchanged)
2. `# platforms` — one row per `PLATFORMS` entry: label, colored status, link `→ /admin/platforms/{id}`
3. `# trends · 12w` — four rows: `new_users`, `new_restaurants`, `tag_applications`, `saves`; each row = label + `<Spark values={...} />` + current-week count
4. `# trending cities · 30d` — rows: rank, city, `current` count, delta rendered as `▲ n` in `var(--tm-accent)` / `▼ n` in `var(--tm-err)` / `→ 0` in `var(--tm-muted)`
5. `# web · posthog 7d` — total views + total visitors + `<Spark values={views per day} />`; if `POSTHOG_PERSONAL_API_KEY` unset render `○ needs POSTHOG_PERSONAL_API_KEY` in `var(--tm-warn)` (copy the `needs_key` style from analytics page)
6. Two-column grid: `# activity` feed (type glyph: `+` signup / `#` tag / `≡` list, label, relative date) | `# top tags` (existing block, unchanged)

Error state for any null block:

```tsx
<TRow last><span style={{ color: "var(--tm-err)" }}>query failed — see Railway logs</span></TRow>
```

Delete `getRecentUsers` and its "recent signups" column (superseded by the feed).

- [ ] **Step 4:** `npm run type-check && npx vitest run` — PASS. Manual check `http://localhost:3050/admin`: all six blocks render; kill `POSTHOG_PERSONAL_API_KEY` locally to confirm the warn state.
- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: /admin landing dashboard — trends, city leaderboard, posthog, activity feed"
```

### Task 15: Full verification + house dashboard-page updates + PR

- [ ] **Step 1:** `npm run type-check && npx vitest run && npm run build` — all green. Build must succeed (catches `generateStaticParams` regressions).
- [ ] **Step 2:** Update the living dashboard data per house rule:
  - `src/app/admin/changelog/page.tsx` — new `RELEASES` entry (docs reorg + dashboard, today's date)
  - `src/app/admin/todo/page.tsx` — mark the docs-fix item done if present; add none
  - `src/app/tech/page.tsx` — `BUILD_JOURNAL` entry + `STATS` (test count grows by ~15)
  - `src/app/roadmap/page.tsx` — `SESSION_VELOCITY` entry
  - `src/app/changelog/page.tsx` — new release entry
  - `src/app/analytics/page.tsx` (public) — `VELOCITY_DATA` entry
  - `CLAUDE.md` — update docs/ description (registry-driven, 13 docs) + test table
- [ ] **Step 3: Commit** — `git add -A && git commit -m "docs: sync dashboard pages + CLAUDE.md for docs/dashboard session"`
- [ ] **Step 4: Push + PR** (do not merge without user approval):

```bash
git push -u origin feat/admin-docs-dashboard
gh pr create --title "Admin docs reorg + landing dashboard" --body "$(cat <<'EOF'
## Summary
- Single DOCS_REGISTRY drives /admin/docs index + viewer (kills 5 desync 404s)
- Docs grouped: planning / operations / product / reference / context
- New ops docs: operations.md, architecture.md, metrics.md; going-live refreshed (+blockers merged)
- /admin landing dashboard: 12-week trends, 30d city leaderboard, PostHog web stats, activity feed
- ~15 new unit tests (trends, city-stats, activity-feed, posthog, registry invariants)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5:** Report PR URL to the user.
