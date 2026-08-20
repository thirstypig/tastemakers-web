---
id: DOC-016
type: changelog
status: active
phase: null
owner: james
tags: []
links: [DOC-005]
updated: 2026-07-23
---

# Changelog

**What shipped, when.** Append an entry when a roadmap item reaches `done` or a phase
completes. Newest first.

<!-- HOW TO USE
     One entry per shipped thing, not per commit. If a user or an operator would not
     notice it, it does not need an entry.
     Link the RM-## or PRD it closes so the trail runs: roadmap -> PRD -> changelog. -->

## Entry format

```markdown
## YYYY-MM-DD — Short title

**Closes:** RM-## · PRD-###
**Repos:** backend, web

- What changed, in plain language
- What changed
```

---

## 2026-08-19 — Verifying the backlog, and finding what it was wrong about

**Closes:** todos 002, 013, 015, 020, 021, 022, 024, 025, 027, 029, 031, 036, 038, 053, 056, 065,
085, 090, 091, 092, 093, 094, 096, 097, 099, 105, 110, 118, 124 · backend 003, 004, 005, 009, 018,
029, 032 · **Repos:** backend, web, todos

The starting point was a backlog that could not be trusted. Of the pending P1s checked against
source and against production, roughly **40% were already fixed**. The indexes are now generated
from the filenames, so the counts cannot drift again.

- **Two live defects on the shipped iOS build.** First-time Apple sign-in returned 500 for every
  user — the raw identity token was written into `users.password`, a `varchar(255)`. And the
  bookmark toggle read the wrong pivot, so **once one person saved a restaurant, nobody else
  could.** Writing the test for the second surfaced a third: `sync()` was detaching every other
  user's bookmark.
- **Photo upload was never reaching the disk.** `restaurant-image-save` 500s on its *first*
  statement — `logAdd` wrote four column names `api_logs` does not have. TASK-20 attributes this
  to Railway's ephemeral filesystem, which is true and secondary.
- **A landmine defused.** `restaurant-detail` carries two GROUP BY violations behind a Foursquare
  gate that fails first. Setting `FOURSQUARE_API_KEY` — an open P1 — would have converted a soft
  200 into a hard 500 on the app's main screen.
- **Web identity came from a field the user can write.** Tag writes and deletes took the acting
  user from `user_metadata.app_user_id`, which any signed-in visitor can set on themselves. And
  the admin gate **failed open**: a missing environment variable skipped it entirely.
- **`/cuisines` was serving wrong numbers.** It aggregated 1,000 of 1,572 join rows through
  PostgREST's cap, and `placeCount` is the sort key — so counts *and* ordering were wrong, and the
  page looked fine.
- **Search stopped meaning what you typed.** `LIKE` is case-sensitive on PostgreSQL, so "Pizza"
  matched nothing while "pizza" matched 14 — and iOS autocapitalises. Separately the tag typeahead
  let `%` and `_` through as wildcards.
- **The tastemaker pages joined the rest of the site.** They were the last occupants of the dark
  `(public)` group and read as a different product. 47 hardcoded hex values replaced with v2
  tokens.
- **Documented the whole class.** Eight defects, one cause — the engine changed and the code did
  not. See `tastemakers-backend/docs/solutions/database-issues/mysql-to-postgres-dialect-and-schema-drift.md`,
  which includes the detection recipes and the trap that hid half of them.

**Not fixed, deliberately:** the login throttle still keys on Railway's rotating proxy IPs
(todo 123), so login is effectively unthrottled whatever the `x-ratelimit` headers say. Passport
token TTL stays unset until iOS can handle a 401 (backend 066) — setting it today would strand
every installed user with no route back to login.

Tests: backend 106 → 162, web 392 → 442.

## 2026-08-19 — The backend the App Store build talks to, repaired

**Closes:** TASK-01/02/03/09/10/13/15/16/19 · todos 021, 051, 057, 058, 067, 068, 119, 120 · **Repos:** backend, web

A day of repair on the 2021 Laravel code, after the shim reconnected the installed base and
revealed what it had been unable to reach.

- **Tag voting works again.** `UNIQUE (restaurant_id, tag_id)` meant a second person applying
  an existing tag got HTTP 500, and every vote count was pinned at 1. Replaced with
  `(restaurant_id, tag_id, user_id)` — unlimited voters, one vote each. Proven on live data:
  one tag went 1 → 3 votes in a rolled-back transaction. **Does not recover the ~941 votes
  the original migration deleted** (TASK-18).
- **Apple Sign-In accepted forged tokens.** The identity token's signature was never checked,
  and the account was then looked up by the token's `email` claim — so any forged JWT naming a
  victim returned a working access token. Now verified against Apple's JWKS, failing closed.
  Two further bugs found while testing meant *new* Apple signups had never been possible at all.
- **Authorization.** Three endpoints authenticated the caller then acted on an id from the
  request body: any user could delete any list, delete anyone's tags, or read any profile
  (which returned `email`, `device_token` and `fcm_token` publicly).
- **PostgreSQL dialect.** Removed the last MySQL-only SQL: 36 `IFNULL` → `COALESCE`, 2 `IF()` →
  `CASE WHEN` (the tag-level thresholds), `radians(varchar)` cast at 48 sites, and `HAVING` on a
  SELECT alias replaced at 14. Distance queries run again.
- **Deploys apply migrations.** `railway.json` used `deploy.releaseCommand`, which is not a
  Railway key — so `artisan migrate` had **never run**, on any deploy, while every deploy
  reported SUCCESS. See **SOL-007**.
- **Dead code.** `RestaurantController` 3059 → 2480 lines; `GET /api/restaurants1` was
  registered against a commented-out method and returned 500 on every call.

Backend tests 5 → 106 (3 deliberately red). Web 392.

**Not fixed:** discovery still returns `status:false` (Foursquare unkeyed, TASK-21); the tag
`level` can only ever compute 5 (todo 121); RLS is off on all 31 tables (TASK-22).

---

## 2026-08-18 — Hardening the /v2/api iOS shim

**Closes:** todos 108, 109, 111, 113, 114, 116, 117 · **Repos:** web

- Uploads >10 MB through the shim returned a plain-text 500 after 37s (Next truncates a
  proxied body past its 10 MB default while forwarding the original Content-Length).
  Raised `middlewareClientMaxBodySize`, set `proxyTimeout` to 45s.
- The two tests guarding the shim passed while it was broken — verified by mutation.
  They now execute `next.config.ts` rather than pattern-matching its source.
- Middleware no longer runs on `/v2/api`: it stripped nothing and leaked Supabase auth
  cookies to the Laravel host while discarding rotated ones. Now strips `Cookie` and
  client-supplied `x-forwarded-*`, and forces `Accept: application/json` so an expired
  iOS token returns 401 instead of a 302 to an ATS-blocked `http://` URL.
- New tripwire: no redirect may capture `/v2/api`. Redirects run before rewrites, so an
  apex→www canonicalisation would silently downgrade every legacy POST to GET.
- `robots.txt` disallows `/v2/api`; ADR-002 and TASK-24 record the decision and its exit.
- Docs that contradicted the shipped state corrected (`root-claude.md`, `architecture.md`,
  `CLAUDE.md`, RISK-004 re-scoped).

**Not fixed:** the Laravel rate limiter never decrements — no brute-force protection on
login/signup/password-reset. Needs the Railway `CACHE_DRIVER` value. Todo 110.

## 2026-08-18 — domain merge, and reconnecting the iOS app

**The web app moved to the brand domain.** `www.tastemakersapp.com` and the
apex both serve this app; `app.tastemakersapp.com` is retired. Until today the
brand domain served a 15 KB static page with **zero `<h1>`** from a different
Railway service, while the entire v2 redesign lived on a subdomain nobody links
to.

- `CANONICAL_ORIGIN` / `canonical()` replaced 15 hardcoded origins. Moving the
  site is now one environment variable plus a redeploy. Deliberately a *new*
  variable rather than reusing `NEXT_PUBLIC_SITE_URL`, which is
  `localhost:3050` in dev by design — canonicals must never derive from it.
- Removed a fallback rewrite sending unmatched `/api/*` to
  `http://localhost:4050`, the dev port, shipped to production. It returned
  **500** rather than 404 for every unmatched path.
- Redirects for three URLs hardcoded in the shipped App Store binary:
  `/privacy-policy`, `/review-tag`, `/about-us`.
- **`/v2/api/*` now forwards to the Laravel host.** Every request the live iOS
  app makes was 404ing — that path was the old Namecheap layout and has not
  existed since the Railway move. Old App Store versions stay installed for
  months, so this could not have been fixed by shipping a new build.
- A persistent App Store link in the app shell. The link existed in three
  places, all unreachable: signed-out only, first-visit only, or on two v1
  pages.

**Caught by adversarially re-checking claims already shipped:** the canonical
fallback still named the retired `app.` domain, so any build without the
environment variable set would have published unresolvable canonicals and
sitemap. Nine tests asserted the dead value.

**Not fixed, deliberately:** profile images still 404 — they lived on the
Namecheap disk and were never migrated to object storage (TASK-20). And
`/v2/api/restaurants` still fails server-side; connectivity is restored, not
every endpoint behind it.

## 2026-08-17 — v2 web rebuild, tag ranking, and an SSR fix

**Closes:** TODO-090, TODO-091 · PRD-001, PRD-003
**Repos:** web

- The public app moved to the **v2 light design system** in a new `(app)` route group —
  home, search, cuisines, lists, restaurant detail, photos, bookmarks, profile and sign-in.
  Nav is a bottom tab bar under 768px and a top bar above it; the sidebar, drawer and icon
  rail are gone.
- Code reorganised into **feature modules** under `src/features/`, each owning its queries,
  components and stylesheet.
- **Tag levels now match iOS.** A tag's level is its gap from that restaurant's leading tag,
  not an absolute vote threshold — the two products previously ranked the same restaurant
  differently. The five-level ramp was re-derived for a light canvas; the source design's
  ramp was drawn for a dark page, where its strongest fill reads at 15:1 but measures 1.06:1
  on ours, inverting the hierarchy.
- **Restaurant and list URLs are now name-plus-id.** Old numeric URLs still resolve and
  `rel=canonical` points at the slug form.
- **Every page was reaching crawlers empty.** `useSearchParams` in `PostHogProvider` shared
  the root Suspense boundary with the whole app, so statically generated pages shipped a
  shell with no `<h1>`, no tags and no content — while build, typecheck, tests and
  screenshots all stayed green. Documented as SOL-005.
- **A vote could be silently dropped.** `POST /api/restaurants/[id]/tag` returned 200 on a
  unique-constraint violation, so a second user's vote vanished while the API reported
  success. It now distinguishes "already voted" from "the constraint blocked this" (409).
- **The restaurants index ranked from a quarter of the data.** PostgREST caps responses at
  1000 rows regardless of `.limit(5000)`, so the second most-tagged restaurant in the
  database never appeared. `fetchAllPages` walks ranges instead.
- Newsletter signup wired to beehiiv behind `/api/subscribe`, with the key server-side only.
- Tests: 127 → **363**, and component testing is now possible at all — the repo had
  `@testing-library/react` installed with no JSX transform.

---

## 2026-07-23 — Docs system established

**Closes:** —
**Repos:** web

- Created the `/docs` knowledge base: frontmatter convention, controlled 14-tag
  vocabulary, ID scheme, and section mapping (`README-DOCS.md`)
- Wrote `PRD-001` — the first retroactive PRD, reconstructing restaurant tagging &
  voting from the code with every claim marked `[intended]`/`[inferred]`/`[unknown]`
- Wrote `ADR-001` — feature module isolation: 7 module boundaries, extraction order,
  and the API Resource prerequisite
- Added the comment-inbox loop (`scripts/sync-inbox.mjs`) and the living-docs generator
  (`scripts/refresh-docs.mjs`) with `npm run docs:refresh`

---

<!-- Entries below this line are RECONSTRUCTED from git history, not written at the
     time. Dates are commit dates and are reliable; the framing is mine. Correct
     anything that misrepresents what actually shipped. -->

## Reconstructed history

### 2026-06-10 — Admin docs dashboard
**Repos:** web
- Registry-driven documentation index at `/admin/docs`, reading local files and private
  repos via the GitHub Contents API
- Fixed doc rendering broken by the marked v18 token API

### 2026-06-05 — Backend security pass
**Repos:** backend
- Resolved a batch of P1/P2 findings — security, seeder hardening, schema (todos 032–062)
- Removed the temporary admin token generator route after use

### 2026-06 — Hosting migration to Railway
**Repos:** backend, web, marketing
- Laravel API live at `api.tastemakersapp.com`
- Web app live at `app.tastemakersapp.com` with Google OAuth admin login
- Supabase PostgreSQL provisioned, all services connected

### 2026-05 — AI tag-seeding pipeline built
**Repos:** backend
- Four services with 55 unit tests: Google Places, Anthropic (Claude Haiku),
  Voyage AI embeddings, and the seeder orchestrator
- pgvector similarity dedup on `tags.embedding`
- ⚠️ Built but never run at scale — the queued job and CLI command are still unbuilt

### 2021 — Original build
**Repos:** backend, ios
- Restaurant tagging & voting, discovery, tastemaker lists, social follows, photos,
  accounts, push notifications
- Shipped to the App Store (id 1573533249)
- See `PRD-001` and `launch-spec.md` for the reconstructed scope

<!-- TODO(james): the 2021 entries are coarse. If you remember the order features
     actually shipped in, split them out — the code cannot recover release boundaries. -->
