---
id: DOC-006
type: todos
status: active
phase: null
owner: james
tags: []
links: [DOC-005, PRD-001]
updated: 2026-08-19
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
| **TASK-01** | 🔴 **REVISED 2026-07-24 — already applied, not pending.** `UNIQUE (restaurant_id, tag_id)` is **live in production**. Drop it and replace with `UNIQUE (restaurant_id, tag_id, user_id)`. This stops the HTTP 500 on the second tagger (RISK-017) but **does not recover the deleted votes** — see TASK-18. **DONE 2026-08-19.** Replaced with `UNIQUE (restaurant_id, tag_id, user_id)` via migration 2026_08_18_000001, applied and verified on production. Two extra users voting the same tag now succeed (1→3 in a rolled-back live test). Does NOT recover the ~941 already-deleted votes — that is TASK-18. | `PRD-001`, `EXP-001` | p1 | `done` |
| **TASK-24** | Retire the `/v2/api` iOS shim (`tastemakers-web/next.config.ts`). **Blocked on two things:** the iOS build that moves `NetworkManager.swift:14` off the legacy prefix must ship AND drain, and shim usage must be instrumented — the stated gate ("iOS adoption > 90%") currently has no instrument behind it, since PostHog is browser-only and never sees a `URLSession` call. Removal condition: `/v2/api/*` under 10 requests/day for 30 consecutive days. | RM-01, RISK-004 | p2 | `open` |
| **TASK-19** | Old numeric URLs (`/restaurants/159`) do not 301 to the canonical slug. `permanentRedirect` never fires — streaming commits a 200 before the page resolves. Needs middleware. **DONE — verified 2026-08-19.** `/restaurants/159` returns 308 to `/restaurants/langer-s-delicatessen-restaurant-159`, which serves 200. | SEO | p2 | `done` |
| **TASK-20** | Photo upload is off. `restaurant-image-save` writes to `public_path('storage/res_image')` — Railway's filesystem is ephemeral, so uploads vanish on restart. Needs object storage. **Also why every legacy profile image 404s.** | Photos | p1 | `open` |
| **TASK-21** | Foursquare credentials unset, so `/api/restaurants` returns `status:false` for every caller — including the iOS app just reconnected by the /v2/api shim. Legacy V3 deprecated 2026-05-15 and V2 Pro is now priced, so this is a vendor/cost decision. Backend todo 073. **CONFIRMED 2026-08-19:** 12 live `api.foursquare.com` call sites remain in RestaurantController, keys still unset. | Discovery | p1 | `open` |
| **TASK-22** | Row Level Security is disabled on all 31 production Supabase tables, including `users`, `oauth_access_tokens`, `password_resets`. Enabling without policies blocks all access, so this needs a deliberate policy pass. **CONFIRMED 2026-08-19:** 0 of 31 public tables have RLS enabled. | Security | p1 | `open` |
| **TASK-23** | ~75 PostgreSQL `GROUP BY` violations in the backend; `HomeController` is effectively 100% broken. Surfaced by the MySQL→PostgreSQL sweep. **CONFIRMED LIVE 2026-08-19:** now the top blocker on `getTastemaker-CreatedList`, which gets past the two fixes shipped in PR #18 and then fails on `bookmark_testmaker_list.user_id must appear in the GROUP BY`. Note these are NOT mechanical — that query never filters the bookmark join to the requesting user, so 'add the columns to GROUP BY' would change what users see. | Discovery | p2 | `open` |
| **TASK-18** | Attempt vote recovery: get a pre-migration dump of `restaurant_tag` from the legacy Namecheap MySQL host (cPanel → phpMyAdmin export, or any backup). The legacy DB was bound to `127.0.0.1` so it is unreachable remotely — this needs cPanel access. **Do it before the hosting is cancelled**, or the original vote counts are gone permanently. | `EXP-001`, RISK-001 | p1 | `open` |
| **TASK-02** | Add an ownership check to `tastemaker_listdelete` — currently any authenticated user can delete any list by guessing an integer id | RM-02 | p1 | `open` |
| **TASK-03** | Replace body `user_id` with `Auth::id()` in `tagsdelete` — the add path authenticates, the delete path doesn't | `PRD-001` §9, RM-02 | p1 | `open` |
| **TASK-04** | Commit the four uncommitted code-review findings (todos 067–070) in the backend repo **DONE — verified 2026-08-19.** Backend working tree is clean; todo 067 is closed. | RM-02 | p3 | `done` |
| **TASK-05** | ~~Repoint the backend's local `main` to track `origin/main`~~ **Done 2026-08-19.** Was tracking `gitlab/main`, so every `git status` reported a false "ahead 86" and every sync check had to be re-run against `origin` explicitly. Note the premise was also wrong: GitLab is *not* inaccessible — see the corrected root CLAUDE.md. | — | p3 | `done` |
| **TASK-06** | Set `FOURSQUARE_API_KEY` in Railway — `/api/restaurants` fails without it | RM-01 | p2 | `open` |
| **TASK-07** | Confirm whether `testmaker_list` and a badges table exist in production — both are queried by controllers but have no migration **CONFIRMED PRESENT 2026-08-19:** `testmaker_list`, `badge_categories`, `bookmark_testmaker_list`, `category_restaurant` and `testmaker_list_restaurant` all exist in production. The remaining work is migrations, not confirmation — see TASK-14 and todo 120. | RM-01 | p2 | `open` |
| **TASK-08** | Write the six missing tagging tests listed in `PRD-001` §8 — especially "two different users applying the same tag increments the count" | `PRD-001` | p2 | `open` |
| **TASK-09** | Fix `getallBadges` — it calls `Auth::user()`, never uses it, and hardcodes `user_id = 43` in **three** places. Every user sees user 43's badges. **DONE 2026-08-19.** `Auth::id()` replaces the hardcoded 43 in all three places; zero occurrences remain. Shipped with TASK-16, which was mandatory to ship together. | RM-02 | p1 | `done` |
| **TASK-10** | Replace 19 MySQL-only `IFNULL`/`IF()` calls with `COALESCE`/`CASE` — they throw on PostgreSQL, so `getallBadges` and others break on Supabase **PARTIAL 2026-08-19:** the `IFNULL`s inside `getallBadges` are fixed (`COALESCE`), which unblocked that endpoint. **17 remain in UserController alone** — each belongs to a different endpoint and needs its own verification. | RM-13, RM-01 | p1 | `open` |
| **TASK-11** | Verify a restaurant with **zero tags** still appears in name search, and fix if not — James's stated requirement | `PRD-003` | p2 | `open` |
| **TASK-12** | Instrument search events (query, results shown, click position) **before** changing ranking, so the change can be evaluated | RM-03, `PRD-003` | p2 | `open` |
| **TASK-13** | Determine what `/restaurants1` is — live, experimental, or dead. Dead code carried through module extraction costs real effort. | RM-05 | p3 | `open` |
| **TASK-14** | Confirm `badge_categories` and `testmaker_list` exist in production and add stub migrations so `artisan migrate` is trustworthy **PARTIAL 2026-08-19:** `2026_08_18_000000` creates five legacy tables, but **misses `testmaker_list_restaurant`**, so a migration-built DB still cannot run the tastemaker-list endpoints. Todo 120. | RM-01, RISK-009 | p2 | `open` |
| **TASK-15** | Delete `review_count1` — 125 lines, unrouted, references an undefined `$data` so it would fatal if ever called. Larger than the entire tagging feature. **DONE — verified 2026-08-19.** `review_count1` no longer exists in RestaurantController. | `PRD-004`, RM-05 | p3 | `done` |
| **TASK-16** | Move `POST /getallBadges` behind `auth:api` — a *personalised* read cannot be public and correct at once. Must ship together with TASK-09. **DONE 2026-08-19.** Route moved inside the `auth:api` group. Unauthenticated now returns 401 (was 200 with user 43's data). | `PRD-004`, RM-02 | p1 | `done` |
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
