---
id: DOC-009
type: decision-log
status: active
phase: null
owner: james
tags: []
links: [ADR-001]
updated: 2026-07-23
---

# Decision log

**One line per small decision.** Date · decision · why.

This is the low-ceremony counterpart to `adrs/`. If a decision is expensive to reverse
— framework, database, auth model, module boundaries — it earns an ADR. Everything
else lands here.

The value isn't the decision, it's the **why**. Six months on, the decision is visible
in the code; the reason is not. Skip the why and this file is worthless.

<!-- Newest at the top. Keep each entry to one line. If it needs a paragraph, it's an ADR. -->

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
| 2026-06 | Vercel dropped; `tastemakers-web` deploys via Railway only | Consolidate on one platform — backend was already there |
| 2026-06 | Marked v13+ custom renderer overrides banned in `tastemakers-web` | The token API broke them, producing `[object Object]` in tables; `renderMarkdown()` is the only sanctioned path |
| 2026-05 | Passport RSA keys stored as env vars, written to disk at boot | Railway's filesystem is ephemeral — keys written any other way vanish on restart |
| 2026-05 | PHP pinned to 8.1 on Railway | Laravel 8 crashes on 8.4+ during bootstrap |
| 2026-05 | Schema changes applied via Supabase SQL editor, not `releaseCommand` | Railway marks a deploy successful even when `releaseCommand` exits non-zero |
| 2026-05 | Testable logic extracted to `src/lib/` instead of living in components | `vitest.config` uses `environment: "node"` — no DOM, so client-component logic can't be unit-tested in place |
| 2021-05 | `pre_define_tags` added ~3 months after free-text tags | **[inferred]** — free-text tagging was fragmenting the vocabulary; see `PRD-001` §4 |

<!-- TODO(james): anything here you remember differently, correct it. An inferred "why"
     that's wrong is worse than no entry — it will be trusted. -->
