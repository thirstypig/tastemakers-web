---
id: DOC-005
type: roadmap
status: active
phase: null
owner: james
tags: []
links: [DOC-002, DOC-006, PRD-001]
updated: 2026-07-23
---

# Roadmap (macro)

**What this is, in plain English:** the long-horizon list. Things that take weeks, not
hours — whole features, migrations, platform launches. If you could finish it this
afternoon, it belongs in `todos.md` (DOC-006) instead.

Each item has a stable `id` that never changes, even when the item moves or gets
renamed. To-dos and PRDs point at these ids, so renumbering would break the trail.

**Status values:** `now` (actively being worked) · `next` (committed, not started) ·
`later` (agreed direction, unscheduled) · `declined` (decided against — reason kept so
it isn't re-litigated) · `done`.

<!-- Add items with the next free RM-## number. Never reuse a number.
     `Links` should point at the PRD that justifies the item, once one exists. -->

---

## Now

| id | Item | Why it matters | Status | Links |
|---|---|---|---|---|
| **RM-01** | Finish the hosting migration | The API is live on Railway but the App Store iOS build still calls the legacy Namecheap host. Until iOS is repointed, production is running on infrastructure being decommissioned. | `now` | — |
| **RM-02** | Fix the P1 security backlog | Substantially drawn down. The "delete any list" IDOR (TODO-068) is closed, and 2026-08-20 closed a live reflected XSS, an unauthenticated file upload, a tag endpoint that 500'd on every call, multi-write data loss + the bookmark TOCTOU, and the reset code in the URL. Remaining P1s are mostly **blocked** on decisions (Google Places, TrustProxies→123), credential rotation (005/046), the GCP key (024), or an iOS release (100/101). See DOC-024 for the triaged list with LOE. | `now` | DOC-024, TODO-006 |
| **RM-13** | PostgreSQL compatibility sweep | `IFNULL`/`IF()`/`GROUP_CONCAT` are **done** — zero MySQL-only constructs remain in `app/`. What remains: GROUP BY strictness (TASK-23) and `restaurants.lat/lng` still `varchar` (backend 015). The whole failure class is documented in `tastemakers-backend/docs/solutions/database-issues/mysql-to-postgres-dialect-and-schema-drift.md`. | `now` | RM-01, TASK-10 |

## Next

| id | Item | Why it matters | Status | Links |
|---|---|---|---|---|
| **RM-03** | Instrument the core loop | The central question — do tags change where people eat — has never been measurable. Every KPI in `PRD-001` §5 is currently unanswerable. | `next` | `PRD-001` |
| **RM-04** | Ship the AI tag-seeding pipeline | 🔺 **PROMOTED 2026-07-24.** `EXP-001` refuted human tag density (86% of restaurants have one tagger) and tagging is down 98.5%. This is now **the only realistic route to the consensus the product rests on** — not enrichment, load-bearing. Four services + 55 tests exist; the job and CLI do not. | `next` | `PRD-001` §7, `EXP-001` |
| **RM-16** | Understand the 98.5% activity decline | 3,068 tags in 2021 → 44 in 2025; 67 taggers → 6. Every other roadmap item assumes users who are no longer here. **This outranks the technical backlog.** | `next` | RISK-016, `EXP-001` |
| **RM-05** | Feature module isolation | Six features share one 2,985-line controller. Every change has an outsized blast radius. Best done while no live client points at Railway. | `next` | `ADR-001` |
| **RM-06** | Tag vocabulary normalisation | Free-text tag creation fragments the vocabulary — the core ranking signal degrades as the corpus grows. | `next` | `PRD-001` §9, TODO-037 |
| **RM-10** | Account management & deletion | No way to delete an account exists. Likely **gates the iOS submission in RM-01** (App Store 5.1.1(v)) and there is no way to honour an erasure request today. | `next` | `PRD-002`, DOC-019 |
| **RM-11** | Search & ranking | **Split 2026-07-24 by `EXP-001`.** Req 1 (untagged restaurants stay findable) still ships now — TASK-11. Req 2 (vote-weighted ranking) is **blocked on density**: with a 1-vote ceiling on 86% of restaurants, weighting would reorder nothing. Waits on RM-04. | `next` (req 1) · `later` (req 2) | `PRD-003`, `EXP-001` |
| **RM-12** | Test coverage for the 2021 features | 55 tests on services that have never run in production; **0** on the code live on the App Store since 2021. Also a prerequisite for safe module extraction. | `next` | `ADR-001`, DOC-010 |

## Later

| id | Item | Why it matters | Status | Links |
|---|---|---|---|---|
| **RM-07** | Android app | Currently a 4-file scaffold with no screens. A real platform gap, not a near-term one. | `later` | — |
| **RM-08** | Marketing site content | One static email-capture page — too thin to pass AdSense review, and no home for the ad units already placed. | `later` | — |
| **RM-09** | Web feature parity | Web has discovery and tagging but no photos, no push, and read-only lists. | `later` | — |
| **RM-14** | Decide what lists + follows are | They serve a *different* value proposition ("follow people whose taste you trust") and were never briefed — yet the product is named after them. Needs usage data, then a decision: invest or retire. | `later` | DOC-023 |
| **RM-15** | Badges: fix or retire | 324 lines across 3 implementations, broken for every user. If they're the supply-side incentive for tagging, they're mis-classified as periphery and need investment. If not, delete them. | `later` | `PRD-004`, DOC-023 |

## Declined

| id | Item | Why declined | Date |
|---|---|---|---|
| _none yet_ | | | |

---

<!-- TODO(james): the profile doesn't define named build phases across the whole
     project — only per-repo ones (backend Phase 1-4, web Phase 1-7). If you want a
     shared phase scheme, define it here and set `phase:` on docs accordingly.
     Left free-form for now rather than inventing a scheme. -->
