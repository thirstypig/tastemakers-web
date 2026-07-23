---
id: DOC-017
type: risk
status: active
phase: null
owner: james
tags: [security, infra]
links: [PRD-001, ADR-001, DOC-005]
updated: 2026-07-23
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
| **RISK-001** | The pending `restaurant_tag` unique-constraint migration deletes every vote and 500s on popular tags | **high** | **high** | james | Committed and unapplied. Destroys the core ranking signal the moment it runs. → TASK-01 |
| **RISK-002** | Any authenticated user can delete any tastemaker list by guessing an integer id | **high** | med | james | No ownership check at all in `tastemaker_listdelete`. → TASK-02 |
| **RISK-003** | Apple Sign-In accepts unverified JWTs | **high** | low | james | Signature is never checked — a forged token would authenticate. Low likelihood only because nobody is attacking it yet. |
| **RISK-004** | iOS in the App Store still calls the legacy Namecheap host, which is being decommissioned | **high** | med | james | Turning off old hosting before the iOS update ships breaks every live user. Sequencing matters. → RM-01 |
| **RISK-005** | `GITHUB_TOKEN` on the web service expires ~2027-06 | med | **high** | james | Admin docs from private repos revert to "could not load" **silently** — no error, no alert. Certain to happen; only the date is uncertain. |
| **RISK-006** | Tag vocabulary fragments as the corpus grows | med | **high** | james | Free-text `firstOrCreate` with no normalisation. Degrades the ranking signal gradually rather than breaking it. → RM-06 |
| **RISK-007** | The core loop has never been instrumented | med | — | james | Not a failure risk — a *blindness* risk. Every KPI in `PRD-001` §5 is currently unanswerable. → RM-03 |
| **RISK-008** | No revenue model exists | **high** | — | james | No pricing, no payment code anywhere. Costs accrue; nothing offsets them. Strategic, not technical. |
| **RISK-009** | Migrations table is out of sync with the real schema | med | med | james | 2.5-year gap implies direct SQL edits. At least two tables (`testmaker_list`, badges) exist with no migration. `artisan migrate` could behave unpredictably. |
| **RISK-010** | Synchronous Foursquare call with `CURLOPT_TIMEOUT => 0` | med | low | james | One slow upstream response ties up a worker indefinitely; a burst could exhaust the pool. |
| **RISK-011** | 19 MySQL-only `IFNULL`/`IF()` calls remain in the two god controllers | **high** | **certain** | james | These **throw on PostgreSQL**. Not a risk of failure — a guarantee of it, the moment those paths run on Supabase. → RM-13, TASK-10 |
| **RISK-012** | `getallBadges` serves user 43's badges to everyone | med | **certain** | james | Hardcoded `user_id = 43` in 3 places. A briefed 2021 feature (see launch-spec) that is silently wrong for every user. → TASK-09 |
| **RISK-013** | No account-deletion path may block the next iOS submission | **high** | med | james | App Store 5.1.1(v). RM-01 requires an iOS submission; if the guideline applies, RM-10 gates it. → `PRD-002` |
| **RISK-014** | Vote data exists only on the legacy host being decommissioned | med | med | james | `EXP-001` — the product's foundational assumption can only be tested against that data. Once the host is gone, the question is permanently unanswerable. |
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
| **Do real restaurants have enough tag votes for ranking to mean anything?** | If most tags have 1 vote, the consensus mechanism is decoration — and `PRD-003` ranking would be built on noise | `PRD-001` §4 A1 · `EXP-001` |
| Is `/restaurants1` live, experimental, or dead? | Dead code carried through module extraction costs real effort. James: *"not sure what that one is — we can talk about that more."* | `DOC-008` · TASK-13 |
| Was free-text tagging deliberate, or did `pre_define_tags` arrive because it wasn't working? | Determines whether normalisation (RM-06) is a fix or a reversal | `PRD-001` §4 A3 |
| Were tastemaker lists, follows, and photos requested, or added by the contractor? | None were in the original 2021 brief, yet the product is named after lists | `launch-spec.md` |
| Where do uploaded photos physically live? | `PRD-002` deletion cannot be designed without knowing what storage to reach into | `DOC-007` · `DOC-019` |

**Parked by decision (2026-07-23):** tag density stays unknown for now — the data lives
only on the legacy host. Captured as `EXP-001`. See RISK-014: this becomes permanently
unanswerable once that host is decommissioned.

### Answered — 2026-07-23

| Question | Answer |
|---|---|
| Should machine-seeded tags count as human votes? | **Yes.** Recorded as intended in `PRD-001` §7. |
| Was public browsing a decision or a shortcut? | **A decision.** Signed-out users browse; an account unlocks writing. → `DOC-008` |
| Do `testmaker_list` and a badges table exist in production? | **Expected to.** Both are used by the live iOS app; `badge_categories` is queried in code. Still needs confirming against the DB + stub migrations → TASK-14. |
| Should a 500-vote tag outrank a 10-vote tag? | **Yes — in search relevance,** not just chip colour. → `PRD-003` |
| Should untagged restaurants appear in search? | **Yes** — present but unranked. → `PRD-003` req. 1 · TASK-11 |
| What was the original 2021 brief? | iOS app · tag review system · Foursquare · badges · Google auth · desktop admin. → `launch-spec.md` |

---

<!-- TODO(james): the risks above are all derived from code. Add the ones only you know:
     - Market: is anyone else solving this? what happens if they do it better?
     - Concentration: what breaks if Railway, Supabase, or Apple changes terms?
     - Bandwidth: this is a solo project - what happens to it if you're unavailable for a month?
     - App Store: any relationship or compliance risk with a 2021-era live app?
     - Data: what's the recovery position if Supabase is lost tomorrow? (see runbook)
     Delete this comment once they're in. -->
