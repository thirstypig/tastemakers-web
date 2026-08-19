---
id: DOC-009
type: decision-log
status: active
phase: null
owner: james
tags: []
links: [ADR-001]
updated: 2026-08-18
---

# Decision log

**One line per small decision.** Date · decision · why.

This is the low-ceremony counterpart to `adrs/`. If a decision is expensive to reverse
— framework, database, auth model, module boundaries — it earns an ADR. Everything
else lands here.

The value isn't the decision, it's the **why**. Six months on, the decision is visible
in the code; the reason is not. Skip the why and this file is worthless.

<!-- Newest at the top. Keep each entry to one line. If it needs a paragraph, it's an ADR. -->
- **2026-08-18** · `www` + apex serve the app; `app.` retired · Railway Hobby caps custom domains at 2 per service, and apex+www consume both — keeping `app.` would have forced a Pro upgrade to gain nothing. The brand domain was serving a dead page while all the content sat on a subdomain.
- **2026-08-18** · Canonical origin gets its own env var, not `NEXT_PUBLIC_SITE_URL` · They answer different questions. `SITE_URL` is "where is this instance reachable" and is correctly `localhost:3050` in dev; canonicals must always name the public home, or a local build publishes localhost canonicals and sitemap.
- **2026-08-18** · Fallbacks assert against a *retired* list, not a current literal · `DEFAULT_ORIGIN` was correct when written and silently wrong once `app.` was retired — a fallback never runs while the env var is set, so nothing notices. `RETIRED_ORIGINS` encodes the invariant instead of the value.
- **2026-08-18** · Deleted the `/api/*` proxy rather than repointing it at Laravel · Repointing would expose the whole Laravel surface through the web domain with the auth-header and CORS questions that implies. Deleting turns confusing 500s into honest 404s.
- **2026-08-18** · Added a narrow `/v2/api/*` forward for the shipped iOS build · Not a reversal of the above: it forwards one dead legacy prefix that old App Store binaries ask for literally, and cannot be fixed by shipping a new build. The guard test now forbids proxying `/api/*` specifically rather than forbidding rewrites at all. Promoted to **ADR-002** on 2026-08-18 — the coupling is cross-repo and cannot be unwound without an App Store cycle. Removal gated on TASK-24.
- **2026-08-18** · Left three backend AuthTest failures red · The API returns 200 with `{"status": false}` where the tests want 4xx. The shipped iOS client only errors on `statusCode >= 500` and reads the body, so the current convention is what the installed base depends on. Changing it needs a coordinated client release; editing the assertions to match the code would have hidden a real contract question.
- **2026-08-18** · Backend test suite unified on `DatabaseTransactions` · Introducing `RefreshDatabase` ran `migrate:fresh` mid-suite, so earlier tests saw a populated database and later ones saw a bare one — order-dependent results, and `--filter` runs disagreeing with full runs.
- **2026-08-19** · `railway.json` must use `deploy.preDeployCommand` (an ARRAY), never `releaseCommand` · Railway silently ignores unknown config keys, so migrations never ran on any deploy for months while every deploy reported SUCCESS. Verify by the `migrations` table, not the deploy status. See SOL-007.

---

| Date | Decision | Why |
|---|---|---|
| 2026-07-23 | Docs board reads an **auto-walked registry**, replacing the hand-maintained `DOCS_REGISTRY` whitelist | Brief item #2 — add a doc, it appears; no TypeScript edit per doc. Frontmatter `type` decides the section; a small path override handles exceptions |
| 2026-07-23 | Doc search moved to `src/lib/docs-filter.ts`, separate from `docs.ts` | `docs.ts` imports `fs`; a client component importing search from it drags `fs` into the browser bundle and the build fails. The Node-free split keeps search testable AND client-safe |
| 2026-07-23 | Reads may be public; **writes are always authenticated** | James confirmed signed-out browsing is intended. Makes the public/auth split a rule, so violations read as bugs rather than choices |
| 2026-07-23 | Machine-seeded tags count as votes, same as human ones | James confirmed. Consequence: `user_id IS NULL` now means "machine-seeded" and nothing else — so `PRD-002` must not null it to anonymise a deleted user |
| 2026-07-23 | Vote weight belongs in **search relevance**, not just tag colour | A 500-vote tag and a 10-vote tag currently render identically; the fix is ranking → `PRD-003` |
| 2026-07-23 | Untagged restaurants stay in search results, unranked | Absence of tags shouldn't make a restaurant unfindable — a hole in search is worse than an unranked result |
| 2026-07-23 | Tag-density question parked, not dropped | Data lives only on the legacy host; captured as `EXP-001` so it survives as a question rather than being silently forgotten |
| 2026-07-23 | Legacy `solutions/` docs keep their richer schema; frontmatter added additively | `symptoms`, `severity`, `verified` are better for troubleshooting than my base schema. Frontmatter is extensible — replacing them would have been a downgrade |
| 2026-07-23 | Added an `inbox` type, pinned above Product on the board | The inbox is a work queue, not reference material — burying it in Operations defeats the "read it at session start" ritual |
| 2026-07-23 | A comment cannot reach `resolved` without a `link` (commit SHA or doc id) | A resolution nobody can verify is just a claim that it was handled |
| 2026-07-23 | `sync-inbox.mjs` skips malformed comments with a warning rather than failing the run | One bad row shouldn't block the whole inbox; silence would be worse, so skipped rows are printed and rendered into the doc |
| 2026-07-23 | Docs live in `tastemakers-web/docs/`, not the repo root | Root isn't a git repo — docs there would be unversioned and invisible to the deployed board |
| 2026-07-23 | Added `shipped: true/false` as a PRD-only frontmatter field | `status` describes the *doc's* lifecycle; it can't also express whether the *feature* is live |
| 2026-07-23 | Extended the `type` vocabulary by 8 values (`solution`, `guide`, `context`, `note`, `marketing`, `security`, `prompt`, `design-system`) | Five of the nine board sections had no type that could populate them |
| 2026-07-23 | Controlled tag vocabulary capped at 14 | Small enough to remember; adding a 15th is a deliberate decision, logged here |
| 2026-07-23 | Module isolation mapped in docs before any code moves | The window to refactor safely is open (no live client on Railway) but P1 security fixes come first — see `ADR-001` |

---

## Older decisions — reconstructed, not contemporaneous

These predate the log. They are **[inferred]** from code and prior notes; the "why" is
reconstruction, not a record. Correct any that are wrong.

| Date | Decision | Why (inferred) |
|---|---|---|
| 2026-08-17 | `tastemakers-web` restructured into `src/features/*` modules | Applies ADR-001's principle to the web app. Each feature owns its queries, components and stylesheet; shared helpers in `lib/api/shared.ts`. **ADR-001 itself is backend-scoped and remains unimplemented.** |
| 2026-08-17 | A component owns its stylesheet; `css-wiring.test.ts` enforces it | Splitting one `globals.css` into feature stylesheets dropped rules five separate times. A missing CSS import renders unstyled rather than erroring, so nothing catches it — the test now fails on a used-but-undefined class or an unimported stylesheet |
| 2026-08-17 | Bottom tab bar under 768px, top bar above; no sidebar | Nav fell to four items once Search (already in the top bar) and Profile (meaningless signed-out) were removed. Four items justify neither a 240px column nor a hamburger, and one nav per breakpoint replaced three mechanisms |
| 2026-08-17 | Restaurant and list URLs are name-plus-id | Name alone is not unique — 68 slugs shared, 14 In-N-Out Burgers, 34 non-Latin names. Trailing id parses back out, so old numeric URLs still resolve |
| 2026-08-17 | Tag levels use the iOS gap-from-leader rule, not absolute thresholds | Web's 10/5/3/2 thresholds ranked the same restaurant differently from the app. `assignTagLevels` ports `Utils.calcucateTagLevels` exactly |
| 2026-08-17 | Component tests are now possible — `@vitejs/plugin-react` added | Supersedes the 2026-05 entry below in part: logic still belongs in `src/lib/`, but a component's own behaviour (optimistic vote rollback) can now be tested in jsdom. The repo had `@testing-library/react` installed with no JSX transform, so no component test had ever run |
| 2026-06 | Vercel dropped; `tastemakers-web` deploys via Railway only | Consolidate on one platform — backend was already there |
| 2026-06 | Marked v13+ custom renderer overrides banned in `tastemakers-web` | The token API broke them, producing `[object Object]` in tables; `renderMarkdown()` is the only sanctioned path |
| 2026-05 | Passport RSA keys stored as env vars, written to disk at boot | Railway's filesystem is ephemeral — keys written any other way vanish on restart |
| 2026-05 | PHP pinned to 8.1 on Railway | Laravel 8 crashes on 8.4+ during bootstrap |
| 2026-05 | Schema changes applied via Supabase SQL editor, not `releaseCommand` | Railway marks a deploy successful even when `releaseCommand` exits non-zero |
| 2026-05 | Testable logic extracted to `src/lib/` instead of living in components | `vitest.config` uses `environment: "node"` — no DOM, so client-component logic can't be unit-tested in place |
| 2021-05 | `pre_define_tags` added ~3 months after free-text tags | **[inferred]** — free-text tagging was fragmenting the vocabulary; see `PRD-001` §4 |

<!-- TODO(james): anything here you remember differently, correct it. An inferred "why"
     that's wrong is worse than no entry — it will be trusted. -->
