---
id: DOC-018
type: experiment
status: active
phase: null
owner: james
tags: [tagging]
links: [PRD-001, DOC-005]
updated: 2026-07-23
---

# Experiment log

**This is where PRD hypotheses get closed out.** Every PRD states a bet in §4/§5. An
experiment is how you find out whether the bet paid. Without this file, PRDs accumulate
untested claims forever and the product runs on assumption.

Each experiment gets an `EXP-###` and links back to the PRD hypothesis it tests.

**The rule that makes this useful: write the success criterion *before* running it.**
A threshold chosen afterwards is a story, not a result. And record failures — a
disproved hypothesis is the most valuable entry this file can hold.

<!-- HOW TO USE
     Entry format below. `result` is one of: pending | supported | refuted | inconclusive.
     "Inconclusive" is honest and common - use it rather than stretching a weak signal. -->

## Entry format

```markdown
### EXP-###: Short title
**Tests:** PRD-### §N — the hypothesis in one line
**Method:** how you'll measure it
**Success criterion:** the number, decided in advance
**Result:** pending | supported | refuted | inconclusive
**What we did about it:** the decision that followed
```

---

## EXP-001: Is there enough tag consensus for ranking to mean anything?

**Tests:** `PRD-001` §4, assumption **A1** — *"Enough users will tag the same restaurant
for counts to mean anything. A tag with one vote is noise."*

This is the foundational bet of the entire product. Tags-as-votes only beats a star
rating if multiple people actually converge on the same tag. It has never been checked.

**Method:** a single SQL query against `restaurant_tag` — no instrumentation needed,
the data is already there:

```sql
SELECT restaurant_id, tag_id, COUNT(*) AS votes
  FROM restaurant_tag
 GROUP BY restaurant_id, tag_id;
-- then: median votes, % of (restaurant, tag) pairs with votes = 1,
--       and distinct taggers per restaurant
```

**Success criterion (set in advance):**
- **Supported** if the median tag on a tagged restaurant has **≥ 3 votes**
- **Refuted** if **> 70%** of (restaurant, tag) pairs have exactly **1 vote**
- **Inconclusive** in between, or if fewer than 100 restaurants carry any tag

**Result: 🔴 REFUTED** — run 2026-07-24 against Supabase production.

> **Correction to this doc's earlier "blocked" note:** production was *not* empty. It
> holds the full 2021–2025 dataset — 4,230 tag rows, 1,388 restaurants, 232 users,
> 108 taggers. The migration happened; the docs saying otherwise were stale.

### The direct measurement — and why it's invalid

| Metric | Value |
|---|---|
| (restaurant, tag) pairs | 4,230 |
| Tagged restaurants | 819 |
| Median votes per pair | **1** |
| **Max** votes per pair | **1** |
| Pairs with exactly 1 vote | **100%** |

A maximum of exactly 1 across 4,230 rows is not user behaviour — it's a constraint.
**`UNIQUE (restaurant_id, tag_id)` is live in production** (unrecorded in the
`migrations` table, so applied via the SQL editor). The vote signal was flattened
before it was ever measured. There are also **759 missing ids** in the sequence,
consistent with the migration's `DELETE` — though `/tags-delete` can also produce gaps,
so that alone isn't proof.

**So the direct measurement cannot answer the question.** The instrument was destroyed
before the reading was taken.

### The ceiling analysis — which the constraint could not erase

A tag on a restaurant can never have more votes than that restaurant has **distinct
taggers**. That distribution survives independently:

| Distinct taggers | Restaurants | Max possible votes |
|---:|---:|---:|
| 1 | **704 (86.0%)** | 1 |
| 2 | 83 | 2 |
| 3–8 | **32 (3.9%)** | 3–8 |

**86% of tagged restaurants have exactly one tagger.** The median tagged restaurant
therefore has a hard ceiling of **1 vote per tag** — it could not reach the ≥3 success
threshold under any history. Only **3.9% of restaurants could ever have produced a
3-vote tag.**

*Caveat, stated honestly:* the tagger count is itself slightly deflated by the
constraint — if a user's only tag on a restaurant was a duplicate, deleting it removed
them from that restaurant entirely. So 86% is an upper bound and 3.9% a lower bound.
For the verdict to flip, the true "≥3 taggers" figure would have to be >50% rather than
3.9%. That is not plausible.

**Verdict: A1 does not hold.** There is not enough tag consensus for vote-count ranking
to mean anything on this dataset.

### Supporting context

| Year | Tags | Taggers |
|---:|---:|---:|
| 2021 | 3,068 | 67 |
| 2022 | 949 | 41 |
| 2023 | 90 | 10 |
| 2024 | 79 | 11 |
| 2025 | 44 | 6 |

**Tagging fell 98.5% from its 2021 peak.** Median tagger covers 2 restaurants; one power
user covers 189. And **100% of rows are `source: user`** — the AI seeding pipeline has
never written a single row.

### What we did about it

1. **`PRD-003` (search & ranking) is built on a refuted assumption.** Ranking by vote
   count cannot work when 86% of restaurants have a one-vote ceiling. It is **not** dead —
   but its ordering changes: **supply first, ranking second.** Moved to blocked pending
   a density strategy.
2. **The AI seeding pipeline is promoted from "nice enrichment" to load-bearing** (RM-04).
   It is the only realistic route to tag density at this activity level — a 98.5% decline
   means human supply will not produce consensus.
3. **RISK-001 / TASK-01 change character** — from *prevent* to *already happened*. See
   `PRD-001` §9 and the risks register.
4. The real headline is not tag density. It is **the 98.5% activity decline** — logged as
   RISK-016.

---

<!-- TODO(james): candidate experiments worth writing up when there's data to run them:
     - Does seeing tags change behaviour? (tag view -> save/list-add conversion) - needs RM-03 instrumentation
     - Do seeded tags and human tags rank differently? - tests the PRD-001 §7 design tension
     - Does the pre-defined tag list reduce vocabulary fragmentation vs free text?
       (this is the 2021 bet that was never measured - see decision-log 2021-05) -->
