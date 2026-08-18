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
**Open to-dos:** 20
### Next up

1. **TASK-01** (p1) — 🔴 **REVISED 2026-07-24 — already applied, not pending.** `UNIQUE (restaurant_id, tag_id)` is **live in production**. Drop it and replace with `UNIQUE (restaurant_id, tag_id, user_id)`. This stops the HTTP 500 on the second tagger (RISK-017) but **does not recover the deleted votes** — see TASK-18.
1. **TASK-18** (p1) — Attempt vote recovery: get a pre-migration dump of `restaurant_tag` from the legacy Namecheap MySQL host (cPanel → phpMyAdmin export, or any backup). The legacy DB was bound to `127.0.0.1` so it is unreachable remotely — this needs cPanel access. **Do it before the hosting is cancelled**, or the original vote counts are gone permanently.
1. **TASK-02** (p1) — Add an ownership check to `tastemaker_listdelete` — currently any authenticated user can delete any list by guessing an integer id

## Code
**2,646 source files · 87,984 lines of application code** across 5 repos.
_Excludes 559 vendored files (429,667 lines) — chiefly the committed Metronic admin theme in the backend. Counting those inflated the figure roughly 10x._
| Repo | Source files | Lines | Vendored (excluded) |
|---|---:|---:|---:|
| `tastemakers-backend` | 1,899 | 27,985 | 429,181 |
| `tastemakers-web` | 234 | 37,592 | 0 |
| `tastemakers-ios` | 479 | 20,117 | 486 |
| `tastemakers-android` | 14 | 416 | 0 |
| `tastemakers-marketing` | 20 | 1,874 | 0 |
### By language
| Language | Lines |
|---|---:|
| PHP | 19,731 |
| TypeScript | 19,431 |
| Swift | 17,920 |
| JSON | 14,183 |
| Markdown | 12,726 |
| CSS | 1,688 |
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
**33 markdown files** in `docs/` (templates excluded).

✅ Every doc has frontmatter.

| Type | Count |
|---|---:|
| `solution` | 5 |
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
| `done` | 6 |
| `locked` | 1 |
| `solved` | 1 |
<!-- generated 2026-08-18T02:49:25.758Z by scripts/refresh-docs.mjs -->