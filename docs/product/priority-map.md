---
id: DOC-023
type: roadmap
status: active
phase: null
owner: james
tags: [tagging, discovery, lists]
links: [DOC-002, PRD-001, PRD-004, DOC-005]
updated: 2026-07-23
---

# Feature priority map

**What each feature does for the product *today*** — not what it was meant to do, and
not what it cost to build. Produced by archaeology Step 3, 2026-07-23.

Impact and effort reads are **[inferred]** best guesses, labelled as such. Effort is
measured where the code makes it measurable (controller lines), estimated otherwise.

**The core value proposition:** tags applied by many people tell you whether a
restaurant fits your occasion.

---

## CORE — directly delivers the value proposition

| Feature | Impact | Effort spent | State |
|---|---|---|---|
| **Restaurant tagging & voting** | **highest** — it *is* the product | **90 lines** (write path) | 6 known defects, 0 tests, never instrumented → `PRD-001` |
| **Restaurant discovery** (Foursquare) | **highest** — no restaurants, nothing to tag | med | ⚠️ Broken in prod: `FOURSQUARE_API_KEY` unset |

## SUPPORTING — makes the core usable

| Feature | Impact | Effort spent | State |
|---|---|---|---|
| **Accounts / identity** | **high** — the vote model *requires* one row per user, so this is load-bearing, not merely enabling | med | Apple JWT unverified; OAuth tokens stored as passwords; **no deletion path** → `PRD-002` |
| **Profile management** | med | med | Functional |
| **Cuisine / categories** | med | med | Added May 2021 as a correction to tag fragmentation. Also the substrate badges are built on. |

## A SECOND PRODUCT — a different value proposition

These don't serve "tags tell you if a restaurant fits." They serve **"follow people whose
taste you trust."** That's a coherent product — it's just not the one that was briefed,
and it's the one the app is *named* after.

| Feature | Impact | Effort spent | State |
|---|---|---|---|
| **Tastemaker lists** | **[unknown]** — potentially high, unmeasured | med-high | Not briefed · no migration · 🔴 any user can delete any list |
| **Social following** | **[unknown]** | med | Not briefed · no migration |

**This is the most consequential thing on this page.** Treating lists and follows as
"features of the tagging product" understates them; they may be the actual product. But
they have never been measured, never had a PRD, and were never asked for. See §Open below.

## PERIPHERY — could be cut with limited loss

| Feature | Impact | Effort spent | State |
|---|---|---|---|
| **Badges** | low today — **[inferred]** was meant to be the supply-side incentive for tagging | **324 lines across 3 implementations** | 🔴 Hardcoded to user 43 · 125 lines dead code · breaks on Postgres → `PRD-004` |
| **Photos** | low | **227 lines** | Not briefed · no migration · storage location unknown |
| **Saving restaurants** | low-med | low | Day-one, but not briefed |
| **Push notifications** | low | low | Not briefed |

## SCAFFOLDING — not user value

| Thing | Note |
|---|---|
| Admin panel + RBAC | Briefed, but operator tooling. **Built 12 days before the restaurants table.** |
| `mandals` | Indian administrative division. Model + controller + admin routes, zero product meaning. **First migration in the repo.** Template residue. |
| `countries` | Same lineage |
| Queue, password resets, Passport | Standard Laravel |

---

## 🔴 Effort went to the periphery while the core stayed thin

This is the clearest pattern the archaeology found, and the numbers are not close:

| Feature | Role | Controller lines | Tests |
|---|---|---:|---:|
| **Badges** | periphery | **324** (3 implementations, 1 unrouted) | 0 |
| **Photos** | periphery | **227** (3 endpoints) | 0 |
| **Tagging** | **core** | **90** (write path) | **0** |

**Periphery outweighs the core roughly 6:1.** And `review_count1` alone — 125 lines of
unrouted, unreachable, would-fatal-if-called dead code — is **larger than the entire
tagging feature**.

Meanwhile the core has, to this day:
- no tag-name normalisation (vocabulary fragments — RM-06)
- **no ranking whatsoever** in tag search — `searchByTags` has no `ORDER BY` (`PRD-003`)
- no instrumentation (RM-03)
- no tests (RM-12)

**[inferred] — the likely explanation** is not carelessness but shape: features with
obvious surfaces (a badge grid, a photo gallery) present clear finish lines, while
"make the ranking good" doesn't. A contractor working to a feature list optimises for
the former. The evidence fits — the unbriefed, migration-less features are exactly the
ones with the most code.

---

## What this implies for sequencing

1. **Fix the core before extending anything.** TASK-01 (the constraint that destroys
   votes), then RM-06 (normalisation), then `PRD-003` (ranking). These are the only items
   that make the value proposition actually work.
2. **Instrument before optimising** (RM-03). Every judgement on this page is `[inferred]`
   because nothing is measured.
3. **Decide what lists and follows are.** If they're the real product, they need PRDs,
   tests, and a place in the value proposition. If they're not, they're carrying a
   🔴 security hole for a feature you don't need.
4. **Badges: fix or retire.** If §2 of `PRD-004` is right and badges are the supply
   incentive, they're mis-classified as periphery and deserve investment. If not, delete
   324 lines. Either is defensible; leaving them broken is not.

---

## Open questions

1. **Are lists and follows the real product?** Not answerable from code — usage data
   would answer it, and none exists.
2. **Were lists/follows/photos requested, or contractor additions?** None were briefed.
3. **Should badges be fixed or retired?** Depends on Q1 in `PRD-004`.
4. **Is the "second product" framing right at all?** It's my read, and the highest-leverage
   thing on this page to disagree with.
