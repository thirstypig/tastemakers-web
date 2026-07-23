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

**Result:** `pending`

**Blocked on:** the Railway production database is empty — live data is still on the
legacy Namecheap MySQL host. This can only run after RM-01 (hosting migration), or
directly against the legacy DB before it's decommissioned.

**Why it matters either way:**
- *Supported* → the consensus model works; invest in surfacing it better (the
  vote-count ceiling of "≥10" is probably too low — see C-001 in the inbox).
- *Refuted* → the ranking is decoration. That reframes the AI tag-seeding pipeline
  from "nice enrichment" to "load-bearing," because machine tags would be the only
  thing producing meaningful density.

**What we did about it:** _pending_

---

<!-- TODO(james): candidate experiments worth writing up when there's data to run them:
     - Does seeing tags change behaviour? (tag view -> save/list-add conversion) - needs RM-03 instrumentation
     - Do seeded tags and human tags rank differently? - tests the PRD-001 §7 design tension
     - Does the pre-defined tag list reduce vocabulary fragmentation vs free text?
       (this is the 2021 bet that was never measured - see decision-log 2021-05) -->
