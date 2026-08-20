---
id: DOC-017
type: risk
status: active
phase: null
owner: james
tags: [security, infra]
links: [PRD-001, ADR-001, DOC-005]
updated: 2026-07-24
---

# Risks register

**Running list of risks and open questions.** A risk is something that could go wrong
and hasn't yet. Once it *has* gone wrong it's a to-do, not a risk.

Each gets a `RISK-###` that never changes. Closed risks stay here with
`status: closed` — the reason it stopped mattering is worth as much as the risk was.

**Impact × likelihood** are deliberately coarse (high/med/low). Precision here is false
comfort.

<!-- HOW TO USE
     The entries below are the risks that are VERIFIABLE FROM CODE AND CONFIG. They are
     real, not examples.
     What's missing is everything only you know: market, competitive, personal
     bandwidth, funding, App Store relationship. Add those - see the prompts at the
     bottom. A risk register with only technical risks is a technical document, not a
     view of the project. -->

---

## Open

| id | Risk | Impact | Likelihood | Owner | Notes |
|---|---|---|---|---|---|
| **RISK-001** | ~~Pending~~ **ALREADY APPLIED** — `UNIQUE (restaurant_id, tag_id)` is live in production | **high** | **occurred** | james | Confirmed 2026-07-24 via `pg_constraint`. Not in the `migrations` table → applied via the SQL editor. Every vote count is capped at 1; 759 ids missing from the sequence. **The risk has materialised** — this is now damage assessment, not prevention. → TASK-01, `EXP-001` |
| **RISK-016** | **Tagging activity has fallen 98.5% from its 2021 peak** | **high** | **occurred** | james | 3,068 tags in 2021 → 44 in 2025; 67 taggers → 6. The product is effectively dormant. Every roadmap item assumes a user base that is no longer contributing. This outranks every technical item in this register. |
| **RISK-017** | The API returns HTTP 500 when a second user applies an existing tag | med | **certain** | james | The unique constraint makes `attach()` throw. Live now. Impact is currently small *because* of RISK-016 — only 6 people tagged in 2025 — but it breaks the core loop for exactly the popular tags that matter. → TASK-01 |
| **RISK-002** | Any authenticated user can delete any tastemaker list by guessing an integer id | **high** | med | james | No ownership check at all in `tastemaker_listdelete`. → TASK-02 |
| **RISK-003** | Apple Sign-In accepts unverified JWTs | **high** | low | james | Signature is never checked — a forged token would authenticate. Low likelihood only because nobody is attacking it yet. |
| **RISK-004** | The `/v2/api` shim in `next.config.ts` is load-bearing for the entire iOS installed base, and its usage is not measured | **high** | med | james | Re-scoped 2026-08-18. The original risk (Namecheap decommission breaks live users) is closed — the shim forwards the legacy prefix to Railway. The live risk is that a 7-line rewrite now gates every shipped iOS client, its removal criterion ("iOS adoption > 90%") has no instrument behind it, and a web-service outage or a broad redirect takes the mobile fleet down. → TASK-24, RM-01 |
| **RISK-005** | `GITHUB_TOKEN` on the web service expires ~2027-06 | med | **high** | james | Admin docs from private repos revert to "could not load" **silently** — no error, no alert. Certain to happen; only the date is uncertain. |
| **RISK-006** | Tag vocabulary fragments as the corpus grows | med | **high** | james | Free-text `firstOrCreate` with no normalisation. Degrades the ranking signal gradually rather than breaking it. → RM-06 |
| **RISK-007** | The core loop has never been instrumented | med | — | james | Not a failure risk — a *blindness* risk. Every KPI in `PRD-001` §5 is currently unanswerable. → RM-03 |
| **RISK-008** | No revenue model exists | **high** | — | james | No pricing, no payment code anywhere. Costs accrue; nothing offsets them. Strategic, not technical. |
| **RISK-009** | Migrations table is out of sync with the real schema  **Cause identified 2026-08-19 (SOL-007):** `railway.json` used `deploy.releaseCommand`, which is not a Railway config key, so migrations never ran on any deploy. Fixed via `preDeployCommand`. | med | **occurred** | james | **Measured 2026-07-24: 31 tables in production, 17 from migrations, 6 from Passport — leaving 8 application tables created entirely outside Laravel** (`testmaker_list`, `testmaker_list_restaurant`, `bookmark_testmaker_list`, `restaurant_images`, `imagelike`, `badge_categories`, `api_logs`, `seed_logs`). `artisan migrate` cannot be trusted to reproduce this schema. → TASK-14 |
| **RISK-018** | Two shipped features have **zero data in production** | low | **occurred** | james | `restaurant_images` = 0 rows (photos: 227 lines of controller, 5 endpoints, never used) and `badge_categories` = 0 rows (so category badges can never be awarded — only the hardcoded "Tastemaker Badge" ever appears). Not an outage; evidence for the periphery-vs-core finding in DOC-023. |
| **RISK-010** | Synchronous Foursquare call with `CURLOPT_TIMEOUT => 0` | med | low | james | One slow upstream response ties up a worker indefinitely; a burst could exhaust the pool. |
| **RISK-011** | Dialect calls are gone; GROUP BY strictness is not | medium | certain | james | `IFNULL`/`IF()`/`GROUP_CONCAT` all converted — zero MySQL-only constructs in `app/`. **Downgraded from high, not closed:** ~66 GROUP BY violations remain (TASK-23) and they are NOT mechanical — `getTastemaker-CreatedList` never filters its bookmark join to the requesting user, so adding columns to the GROUP BY would change what users see. Full class + detection method: `tastemakers-backend/docs/solutions/database-issues/mysql-to-postgres-dialect-and-schema-drift.md` |
| **RISK-012** | `getallBadges` serves user 43's badges to everyone | med | **certain** | james | Hardcoded `user_id = 43` in 3 places. A briefed 2021 feature (see launch-spec) that is silently wrong for every user. → TASK-09 |
| **RISK-013** | No account-deletion path may block the next iOS submission | **high** | med | james | App Store 5.1.1(v). RM-01 requires an iOS submission; if the guideline applies, RM-10 gates it. → `PRD-002` |
| **RISK-014** | **Revised 2026-07-24.** ~~Vote data exists only on the legacy host~~ — production *has* the 2021–2025 data. What is stranded is the **pre-constraint vote counts**: the live copy is capped at 1 per pair, so the original counts survive only in a legacy dump, if one exists. | med | med | james | Recovering them needs cPanel access to the Namecheap host (the DB was bound to `127.0.0.1`). Dies with the hosting account. → TASK-18 |
| **RISK-015** | Docs viewer renders markdown via `dangerouslySetInnerHTML` with no HTML sanitization | low | low | james | `marked` passes raw HTML through, so `<script>` in a doc would run in an admin's session. Mitigated by: admin-only auth gate + all docs are first-party (repo files, CLAUDE.md, todos). Would matter if any indexed doc ever carried user-submitted content. Fix: sanitize `renderMarkdown` output (DOMPurify + a server DOM shim) — a post-process step, not a marked renderer override, so it's compatible with the v18 constraint. |

## Closed

| id | Risk | Why it closed | Date |
|---|---|---|---|
| _none yet_ | | | |

---

## Open questions

Not risks — things we don't know that shape decisions. Move to a risk if the answer
turns out to be bad.

### Still open

| Question | Why it matters | Source |
|---|---|---|
| Is `/restaurants1` live, experimental, or dead? | Dead code carried through module extraction costs real effort. James: *"not sure what that one is — we can talk about that more."* | `DOC-008` · TASK-13 |
| Was free-text tagging deliberate, or did `pre_define_tags` arrive because it wasn't working? | Determines whether normalisation (RM-06) is a fix or a reversal | `PRD-001` §4 A3 |
| Were tastemaker lists, follows, and photos requested, or added by the contractor? | None were in the original 2021 brief, yet the product is named after lists | `launch-spec.md` |
| Where do uploaded photos physically live? | `PRD-002` deletion cannot be designed without knowing what storage to reach into | `DOC-007` · `DOC-019` |

**Resolved 2026-07-24:** the parked tag-density question was answered by running `EXP-001`
against production — **refuted.** 86% of tagged restaurants have exactly one tagger. See
the experiment log and RISK-016.

### Answered — 2026-07-23 / 24

| Question | Answer |
|---|---|
| Should machine-seeded tags count as human votes? | **Yes.** Recorded as intended in `PRD-001` §7. |
| Was public browsing a decision or a shortcut? | **A decision.** Signed-out users browse; an account unlocks writing. → `DOC-008` |
| Do `testmaker_list` and a badges table exist in production? | **Expected to.** Both are used by the live iOS app; `badge_categories` is queried in code. Still needs confirming against the DB + stub migrations → TASK-14. |
| Should a 500-vote tag outrank a 10-vote tag? | **Yes — in search relevance,** not just chip colour. → `PRD-003` |
| Should untagged restaurants appear in search? | **Yes** — present but unranked. → `PRD-003` req. 1 · TASK-11 |
| **Do restaurants have enough tag votes for ranking to mean anything?** | **No — refuted 2026-07-24** by `EXP-001`. 86% of tagged restaurants have one tagger; only 3.9% could ever reach 3 votes. |
| What was the original 2021 brief? | iOS app · tag review system · Foursquare · badges · Google auth · desktop admin. → `launch-spec.md` |

---

<!-- TODO(james): the risks above are all derived from code. Add the ones only you know:
     - Market: is anyone else solving this? what happens if they do it better?
     - Concentration: what breaks if Railway, Supabase, or Apple changes terms?
     - Bandwidth: this is a solo project - what happens to it if you're unavailable for a month?
     - App Store: any relationship or compliance risk with a 2021-era live app?
     - Data: what's the recovery position if Supabase is lost tomorrow? (see runbook)
     Delete this comment once they're in. -->
