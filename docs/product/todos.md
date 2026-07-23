---
id: DOC-006
type: todos
status: active
phase: null
owner: james
tags: []
links: [DOC-005, PRD-001]
updated: 2026-07-23
---

# To-dos (micro)

**What this is, in plain English:** the short list. Things you could sit down and
finish — an afternoon at most. Each one serves a bigger roadmap item, so the `serves`
column tells you *why* you're doing it.

If something here keeps growing until it needs its own plan, it isn't a to-do. Promote
it to `roadmap.md` (DOC-005) and give it an `RM-##`.

## The "done" convention

**Nothing moves to a separate file when it's finished.** A completed task stays right
here with `status: done`, and the board surfaces it as a saved filter.

Archive folders rot because nobody remembers to open them. A filter can't rot — and
keeping done items in place means you can see what actually happened this month.

<!-- Add tasks with the next free TASK-## number. Never reuse a number.
     `serves` = the RM-## or PRD this task advances. If it serves nothing, ask why
     you're doing it. -->

---

## Open

| id | Task | Serves | Priority | Status |
|---|---|---|---|---|
| **TASK-01** | Change the pending `restaurant_tag` unique constraint from `(restaurant_id, tag_id)` to `(restaurant_id, tag_id, user_id)` — as written it deletes every vote and 500s on popular tags | `PRD-001`, RM-06 | p1 | `open` |
| **TASK-02** | Add an ownership check to `tastemaker_listdelete` — currently any authenticated user can delete any list by guessing an integer id | RM-02 | p1 | `open` |
| **TASK-03** | Replace body `user_id` with `Auth::id()` in `tagsdelete` — the add path authenticates, the delete path doesn't | `PRD-001` §9, RM-02 | p1 | `open` |
| **TASK-04** | Commit the four uncommitted code-review findings (todos 067–070) in the backend repo | RM-02 | p3 | `open` |
| **TASK-05** | Repoint the backend's local `main` to track `origin/main` instead of the inaccessible `gitlab/main` (`git branch -u origin/main`) | — | p3 | `open` |
| **TASK-06** | Set `FOURSQUARE_API_KEY` in Railway — `/api/restaurants` fails without it | RM-01 | p2 | `open` |
| **TASK-07** | Confirm whether `testmaker_list` and a badges table exist in production — both are queried by controllers but have no migration | RM-01 | p2 | `open` |
| **TASK-08** | Write the six missing tagging tests listed in `PRD-001` §8 — especially "two different users applying the same tag increments the count" | `PRD-001` | p2 | `open` |
| **TASK-09** | Fix `getallBadges` — it calls `Auth::user()`, never uses it, and hardcodes `user_id = 43` in **three** places. Every user sees user 43's badges. | RM-02 | p1 | `open` |
| **TASK-10** | Replace 19 MySQL-only `IFNULL`/`IF()` calls with `COALESCE`/`CASE` — they throw on PostgreSQL, so `getallBadges` and others break on Supabase | RM-13, RM-01 | p1 | `open` |
| **TASK-11** | Verify a restaurant with **zero tags** still appears in name search, and fix if not — James's stated requirement | `PRD-003` | p2 | `open` |
| **TASK-12** | Instrument search events (query, results shown, click position) **before** changing ranking, so the change can be evaluated | RM-03, `PRD-003` | p2 | `open` |
| **TASK-13** | Determine what `/restaurants1` is — live, experimental, or dead. Dead code carried through module extraction costs real effort. | RM-05 | p3 | `open` |
| **TASK-14** | Confirm `badge_categories` and `testmaker_list` exist in production and add stub migrations so `artisan migrate` is trustworthy | RM-01, RISK-009 | p2 | `open` |
| **TASK-15** | Delete `review_count1` — 125 lines, unrouted, references an undefined `$data` so it would fatal if ever called. Larger than the entire tagging feature. | `PRD-004`, RM-05 | p3 | `open` |
| **TASK-16** | Move `POST /getallBadges` behind `auth:api` — a *personalised* read cannot be public and correct at once. Must ship together with TASK-09. | `PRD-004`, RM-02 | p1 | `open` |
| **TASK-17** | Verify badge image assets exist in the repo, not just on the old Namecheap server — they're served from a filesystem path and Railway's disk is ephemeral | `PRD-004`, RM-01 | p2 | `open` |

## Done

| id | Task | Serves | Completed |
|---|---|---|---|
| **TASK-00** | Add frontmatter to the 5 legacy docs (3 `solutions/`, 2 `superpowers/`) so the board indexes them — additive, every original field preserved | DOC-001 | 2026-07-23 |

---

## Not a to-do

Things that look like to-dos but aren't — kept here so they stop being re-raised:

| Thing | Where it actually lives |
|---|---|
| The 180 code-review findings in `todos/` | They have their own `TODO-###` ids and frontmatter. This file is for *your* next actions, not the finding backlog. |
| "Refactor `RestaurantController`" | Too big. That's RM-05, and it needs `ADR-001` first. |
