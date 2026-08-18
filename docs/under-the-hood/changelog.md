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
