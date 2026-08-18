---
id: DOC-013
type: stats
status: active
phase: null
owner: james
tags: []
links: [DOC-001]
updated: 2026-08-18
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
**Open to-dos:** 23
### Next up

1. **TASK-01** (p1) — 🔴 **REVISED 2026-07-24 — already applied, not pending.** `UNIQUE (restaurant_id, tag_id)` is **live in production**. Drop it and replace with `UNIQUE (restaurant_id, tag_id, user_id)`. This stops the HTTP 500 on the second tagger (RISK-017) but **does not recover the deleted votes** — see TASK-18.
1. **TASK-19** (p2) — Old numeric URLs (`/restaurants/159`) do not 301 to the canonical slug. `permanentRedirect` never fires — streaming commits a 200 before the page resolves. Needs middleware.
1. **TASK-20** (p1) — Photo upload is off. `restaurant-image-save` writes to `public_path('storage/res_image')` — Railway's filesystem is ephemeral, so uploads vanish on restart. Needs object storage. **Also why every legacy profile image 404s.**

## Code
**2,667 source files · 90,416 lines of application code** across 5 repos.
_Excludes 559 vendored files (429,667 lines) — chiefly the committed Metronic admin theme in the backend. Counting those inflated the figure roughly 10x._
| Repo | Source files | Lines | Vendored (excluded) |
|---|---:|---:|---:|
| `tastemakers-backend` | 1,912 | 29,465 | 429,181 |
| `tastemakers-web` | 242 | 38,544 | 0 |
| `tastemakers-ios` | 479 | 20,117 | 486 |
| `tastemakers-android` | 14 | 416 | 0 |
| `tastemakers-marketing` | 20 | 1,874 | 0 |
### By language
| Language | Lines |
|---|---:|
| PHP | 20,381 |
| TypeScript | 20,082 |
| Swift | 17,920 |
| JSON | 14,183 |
| Markdown | 13,792 |
| CSS | 1,753 |
| JavaScript | 1,428 |
| HTML | 738 |
| Kotlin | 139 |
## Routes
| Surface | Count |
|---|---:|
| Backend API — authenticated | 25 |
| Backend API — public | 18 |
| Backend admin (Blade) | 50 |
| Web pages | 36 |
| Web API handlers | 8 |
## Docs
**34 markdown files** in `docs/` (templates excluded).

✅ Every doc has frontmatter.

| Type | Count |
|---|---:|
| `solution` | 6 |
| `prd` | 4 |
| `roadmap` | 2 |
| `note` | 2 |
| `inbox` | 1 |
| `guide` | 1 |
| `adr` | 1 |
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
| `active` | 18 |
| `draft` | 7 |
| `done` | 7 |
| `locked` | 1 |
| `solved` | 1 |
<!-- generated 2026-08-18T16:24:33.091Z by scripts/refresh-docs.mjs -->