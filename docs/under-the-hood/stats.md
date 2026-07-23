---
id: DOC-013
type: stats
status: active
phase: null
owner: james
tags: []
links: [DOC-001]
updated: 2026-07-23
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
**Open to-dos:** 17
### Next up

1. **TASK-01** (p1) — Change the pending `restaurant_tag` unique constraint from `(restaurant_id, tag_id)` to `(restaurant_id, tag_id, user_id)` — as written it deletes every vote and 500s on popular tags
1. **TASK-02** (p1) — Add an ownership check to `tastemaker_listdelete` — currently any authenticated user can delete any list by guessing an integer id
1. **TASK-03** (p1) — Replace body `user_id` with `Auth::id()` in `tagsdelete` — the add path authenticates, the delete path doesn't

## Code
**3,087 tracked files · 505,442 lines** across 5 repos.
| Repo | Files | Lines |
|---|---:|---:|
| `tastemakers-backend` | 2,455 | 457,159 |
| `tastemakers-web` | 116 | 25,519 |
| `tastemakers-ios` | 482 | 20,560 |
| `tastemakers-android` | 14 | 373 |
| `tastemakers-marketing` | 20 | 1,831 |
### By language
| Language | Lines |
|---|---:|
| JavaScript | 306,338 |
| CSS | 122,762 |
| PHP | 19,937 |
| Swift | 17,920 |
| TypeScript | 14,692 |
| JSON | 14,034 |
| Markdown | 8,882 |
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
**31 markdown files** in `docs/` (templates excluded).

✅ Every doc has frontmatter.

| Type | Count |
|---|---:|
| `prd` | 4 |
| `solution` | 3 |
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
| `done` | 4 |
| `locked` | 1 |
| `solved` | 1 |
<!-- generated 2026-07-23T18:53:28.873Z by scripts/refresh-docs.mjs -->