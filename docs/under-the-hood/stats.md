---
id: DOC-013
type: stats
status: active
phase: null
owner: james
tags: []
links: [DOC-001]
updated: 2026-07-24
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
**Open to-dos:** 18
### Next up

1. **TASK-01** (p1) — 🔴 **REVISED 2026-07-24 — already applied, not pending.** `UNIQUE (restaurant_id, tag_id)` is **live in production**. Drop it and replace with `UNIQUE (restaurant_id, tag_id, user_id)`. This stops the HTTP 500 on the second tagger (RISK-017) but **does not recover the deleted votes** — see TASK-18.
1. **TASK-18** (p1) — Attempt vote recovery: get a pre-migration dump of `restaurant_tag` from the legacy Namecheap MySQL host (cPanel → phpMyAdmin export, or any backup). The legacy DB was bound to `127.0.0.1` so it is unreachable remotely — this needs cPanel access. **Do it before the hosting is cancelled**, or the original vote counts are gone permanently.
1. **TASK-02** (p1) — Add an ownership check to `tastemaker_listdelete` — currently any authenticated user can delete any list by guessing an integer id

## Code
**3,125 tracked files · 510,209 lines** across 5 repos.
| Repo | Files | Lines |
|---|---:|---:|
| `tastemakers-backend` | 2,455 | 457,159 |
| `tastemakers-web` | 154 | 30,286 |
| `tastemakers-ios` | 482 | 20,560 |
| `tastemakers-android` | 14 | 373 |
| `tastemakers-marketing` | 20 | 1,831 |
### By language
| Language | Lines |
|---|---:|
| JavaScript | 307,160 |
| CSS | 122,762 |
| PHP | 19,937 |
| Swift | 17,920 |
| TypeScript | 14,894 |
| JSON | 14,148 |
| Markdown | 12,511 |
| HTML | 738 |
| Kotlin | 139 |
## Routes
| Surface | Count |
|---|---:|
| Backend API — authenticated | 25 |
| Backend API — public | 18 |
| Backend admin (Blade) | 50 |
| Web pages | 29 |
| Web API handlers | 6 |
## Docs
**32 markdown files** in `docs/` (templates excluded).

✅ Every doc has frontmatter.

| Type | Count |
|---|---:|
| `prd` | 4 |
| `solution` | 4 |
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
| `done` | 5 |
| `locked` | 1 |
| `solved` | 1 |
<!-- generated 2026-07-24T08:11:39.427Z by scripts/refresh-docs.mjs -->