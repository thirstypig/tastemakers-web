---
id: DOC-013
type: stats
status: active
phase: null
owner: james
tags: []
links: [DOC-001]
updated: 2026-08-21
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
1. **TASK-21** (p1) — Foursquare credentials unset, so `/api/restaurants` returns `status:false` for every caller — including the iOS app just reconnected by the /v2/api shim. Legacy V3 deprecated 2026-05-15 and V2 Pro is now priced, so this is a vendor/cost decision. Backend todo 073. **DECIDED 2026-08-20 — migrate to Google Places** (James). Scoped in backend todos 076/077; no code written. **Call-site count corrected: 6, not 12** — the higher figure counted `config('services.foursquare.timeout')` lines. `GooglePlacesService` already covers 2 of the 3 operations and is already on the new Places API; only pagination is missing. **Blocker the scope found:** 1,385 of 1,388 rows carry Foursquare `place_id`s, and a 24-hex id passes Google's format check, so a straight swap 404s detail lookups for 99.8% of the catalogue *silently*. Tractable because `restaurantDetails` only echoes back the id it was given and reads the rest from our own DB — serving it locally removes 2 of the 6 sites with no vendor dependency.

## Code
**2,735 source files · 99,279 lines of application code** across 5 repos.
_Excludes 559 vendored files (429,667 lines) — chiefly the committed Metronic admin theme in the backend. Counting those inflated the figure roughly 10x._
| Repo | Source files | Lines | Vendored (excluded) |
|---|---:|---:|---:|
| `tastemakers-backend` | 1,961 | 35,865 | 429,181 |
| `tastemakers-web` | 261 | 40,987 | 0 |
| `tastemakers-ios` | 479 | 20,137 | 486 |
| `tastemakers-android` | 14 | 416 | 0 |
| `tastemakers-marketing` | 20 | 1,874 | 0 |
### By language
| Language | Lines |
|---|---:|
| PHP | 24,616 |
| TypeScript | 21,730 |
| Swift | 17,940 |
| Markdown | 16,613 |
| JSON | 14,166 |
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
**37 markdown files** in `docs/` (templates excluded).

✅ Every doc has frontmatter.

| Type | Count |
|---|---:|
| `solution` | 7 |
| `prd` | 4 |
| `adr` | 2 |
| `risk` | 2 |
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
| `runbook` | 1 |
| `stats` | 1 |
| `status` | 1 |
| Status | Count |
|---|---:|
| `active` | 20 |
| `done` | 8 |
| `draft` | 7 |
| `locked` | 1 |
| `solved` | 1 |
<!-- generated 2026-08-21T01:28:26.672Z by scripts/refresh-docs.mjs -->