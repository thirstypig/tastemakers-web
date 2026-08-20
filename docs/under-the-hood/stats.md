---
id: DOC-013
type: stats
status: active
phase: null
owner: james
tags: []
links: [DOC-001]
updated: 2026-08-19
---

# Stats
> **GENERATED — do not hand-edit.** `npm run docs:refresh`.
> **On LOC:** lines of code is a rough vanity signal, tracked here for reference only.
> Real progress is features and phases shipped — see the roadmap section below. A big
> number here can just as easily mean duplication (this codebase has a 2,985-line
> controller and one query copy-pasted four times).
## Where we are
- **In progress:** RM-01 — Finish the hosting migration
- **In progress:** RM-02 — Fix the P1 security backlog
- **In progress:** RM-13 — PostgreSQL compatibility sweep
**Shipped (roadmap items done):** 0
**Committed next:** 7
**Open to-dos:** 13
### Next up

1. **TASK-24** (p2) — Retire the `/v2/api` iOS shim (`tastemakers-web/next.config.ts`). **Blocked on two things:** the iOS build that moves `NetworkManager.swift:14` off the legacy prefix must ship AND drain, and shim usage must be instrumented — the stated gate ("iOS adoption > 90%") currently has no instrument behind it, since PostHog is browser-only and never sees a `URLSession` call. Removal condition: `/v2/api/*` under 10 requests/day for 30 consecutive days.
1. **TASK-20** (p1) — Photo upload is off. `restaurant-image-save` writes to `public_path('storage/res_image')` — Railway's filesystem is ephemeral, so uploads vanish on restart. Needs object storage. **Also why every legacy profile image 404s.** **CORRECTED 2026-08-19:** the ephemeral disk is real but SECONDARY — the endpoint 500s on its first statement, because `logAdd` wrote four column names `api_logs` does not have. Fixed in backend PR #38, so uploads now reach the filesystem and *then* hit this. Validation was also absent (`"image" => ""`); now mimes + size limited. What remains here is genuinely the storage.
1. **TASK-21** (p1) — Foursquare credentials unset, so `/api/restaurants` returns `status:false` for every caller — including the iOS app just reconnected by the /v2/api shim. Legacy V3 deprecated 2026-05-15 and V2 Pro is now priced, so this is a vendor/cost decision. Backend todo 073. **CONFIRMED 2026-08-19:** 12 live `api.foursquare.com` call sites remain in RestaurantController, keys still unset.

## Code
**2,711 source files · 95,451 lines of application code** across 5 repos.
_Excludes 559 vendored files (429,667 lines) — chiefly the committed Metronic admin theme in the backend. Counting those inflated the figure roughly 10x._
| Repo | Source files | Lines | Vendored (excluded) |
|---|---:|---:|---:|
| `tastemakers-backend` | 1,943 | 33,038 | 429,181 |
| `tastemakers-web` | 255 | 39,986 | 0 |
| `tastemakers-ios` | 479 | 20,137 | 486 |
| `tastemakers-android` | 14 | 416 | 0 |
| `tastemakers-marketing` | 20 | 1,874 | 0 |
### By language
| Language | Lines |
|---|---:|
| PHP | 23,224 |
| TypeScript | 20,940 |
| Swift | 17,940 |
| Markdown | 14,971 |
| JSON | 14,162 |
| CSS | 1,909 |
| JavaScript | 1,428 |
| HTML | 738 |
| Kotlin | 139 |
## Routes
| Surface | Count |
|---|---:|
| Backend API — authenticated | 26 |
| Backend API — public | 15 |
| Backend admin (Blade) | 50 |
| Web pages | 36 |
| Web API handlers | 8 |
## Docs
**36 markdown files** in `docs/` (templates excluded).

✅ Every doc has frontmatter.

| Type | Count |
|---|---:|
| `solution` | 7 |
| `prd` | 4 |
| `adr` | 2 |
| `roadmap` | 2 |
| `note` | 2 |
| `inbox` | 1 |
| `guide` | 1 |
| `api-docs` | 1 |
| `component-lib` | 1 |
| `decision-log` | 1 |
| `tech-spec` | 1 |
| `testing` | 1 |
| `intake-rules` | 1 |
| `glossary` | 1 |
| `launch-spec` | 1 |
| `todos` | 1 |
| `changelog` | 1 |
| `costs` | 1 |
| `experiment` | 1 |
| `privacy` | 1 |
| `risk` | 1 |
| `runbook` | 1 |
| `stats` | 1 |
| `status` | 1 |
| Status | Count |
|---|---:|
| `active` | 19 |
| `done` | 8 |
| `draft` | 7 |
| `locked` | 1 |
| `solved` | 1 |
<!-- generated 2026-08-19T23:50:46.547Z by scripts/refresh-docs.mjs -->