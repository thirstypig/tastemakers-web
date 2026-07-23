---
id: PRD-003
type: prd
status: draft
shipped: false
phase: null
owner: james
tags: [discovery, tagging, backend]
links: [PRD-001, DOC-008, DOC-018, RM-11]
updated: 2026-07-23
---

# Search & ranking

> **Forward-looking PRD**, written from two requirements James gave on 2026-07-23:
>
> 1. *"If a restaurant does not have any tags, it wouldn't get ranked, but it should
>    still come up in search."*
> 2. *"The one with 500 votes should get more relevance in a search."*
>
> Both are **[intended]** — stated directly, not inferred. Neither is currently met.

---

## 1. Problem statement

**The product's core signal doesn't reach the place people make decisions.**

Vote counts drive tag *colour* on a restaurant's detail page (`voteCountToLevel()`,
DOC-011) — and nothing else. Verified in `RestaurantController::searchByTags`:

- **There is no `ORDER BY` of any kind.** Results come back in whatever order Postgres
  returns them. A tag with 500 votes and one with 2 rank identically. Requirement 2 is
  unmet.
- **It queries `restaurant_tag` and joins outward**, so a restaurant with zero tags can
  never appear in tag search at all. Requirement 1 is unmet in this path.
- **It filters on `tag_id` only** — an exact id, not text. The client must already know
  the tag's id, so there is no "search" in the sense a user means it.

So the most-agreed-upon tag in the system confers no discovery advantage. The consensus
mechanism `PRD-001` is built around stops at the chip colour.

**Who this affects:** anyone trying to find a restaurant — which is the entire product.

## 2. Strategic rationale

`PRD-001` §2 argues that tags-as-votes is the credibility mechanism of the platform.
That argument only pays off if consensus **changes what people see**. Ranking is where a
vote becomes a recommendation.

This is also the cheapest remaining lever on the core value: the data already exists.
No new collection, no new user behaviour — only using what five years of tagging already
produced.

## 3. User story

> As someone searching for a place, I want restaurants that many people agreed fit what
> I'm looking for to appear first, so that I can trust the top of the list.

> As someone searching for a restaurant by name, I want to find it even if nobody has
> tagged it yet, so that search doesn't have holes.

## 4. Assumptions

| # | Assumption | Status |
|---|---|---|
| A1 | There is enough vote density for weighting to change the order meaningfully | **[unknown]** — this is `EXP-001`, still unrun. If most tags have 1 vote, weighting changes nothing. |
| A2 | Users want consensus-ranked results rather than distance- or rating-ranked | **[decide]** — plausible but unvalidated |
| A3 | Untagged restaurants appearing in results is desirable, not noise | **[intended]** — James stated it directly |
| A4 | Machine-seeded tags should carry the same weight as human votes | **[intended]** — James confirmed 2026-07-23: *"Yeah, that's fine."* |

## 5. Impact & KPIs

### (a) What the metric *should* be

| Metric | Why it's the right one |
|---|---|
| Click-through rate on the top 3 results | Does ranking put the right things first? |
| % of searches ending in a save or list-add | The conversion `PRD-001` §5 identified as the real proof |
| % of searches returning zero results | Requirement 1 exists to drive this down |
| Rank correlation between vote count and click position | Directly tests whether consensus predicts what people want |

### (b) What we can measure today

**Not instrumented.** No search event, no result-impression event, no click event exists
in the backend or iOS. This PRD cannot be evaluated without RM-03 (instrumentation), and
shipping ranking changes blind means never knowing whether they helped.

**Recommendation: instrument search before changing ranking**, not after. Otherwise the
first version becomes the permanent version by default.

## 6. Technical notes

### Current behaviour, verified

| Path | What it does |
|---|---|
| `POST /searchBy-Tags` | Exact `tag_id` filter, no ordering, tagged restaurants only |
| `GET /restaurants` | Foursquare-backed venue search — **currently failing**, `FOURSQUARE_API_KEY` unset |
| `GET /restaurants1` | **[unknown]** — purpose undetermined; James: *"not sure what that one is"* |
| `Restaurant::tagsForRestaurant*` | Four copies of the vote-count query, each `ORDER BY level DESC` — ranking exists for *tags within a restaurant*, never for *restaurants within a result set* |

### Proposed shape

**Requirement 1 — untagged restaurants stay findable.** Search must query `restaurants`
and *left join* tags, rather than querying `restaurant_tag` and joining outward. Untagged
restaurants get a zero score and sort last — present, but never above something people
vouched for.

**Requirement 2 — votes drive relevance.** A score per (restaurant, query) combining:

- vote count on matching tags — **[decide]** how to damp it. Raw count lets one very
  popular restaurant dominate every query; `log(1 + votes)` compresses the tail so 500
  beats 10 clearly but not 50×. My recommendation is logarithmic.
- number of *distinct* matching tags
- text match on restaurant name
- **[decide]** whether distance participates

**A consequence worth stating plainly:** ranking by vote count makes tag data
*load-bearing for discovery*, which raises the stakes on two known defects — the pending
migration that would flatten every count to 1 (TASK-01), and vocabulary fragmentation
splitting one concept's votes across three tags (RM-06). **Both should be fixed before
ranking ships**, or the ranking will faithfully reflect corrupted data.

**Sequencing note:** this lands cleanly *after* the `Discovery` and `Tagging` modules are
extracted (`ADR-001`), since the query currently lives inside a 2,985-line controller
alongside five unrelated features.

## 7. AI implementation notes

No new AI. One interaction from `PRD-001` §7: seeded tags (`source: google_seed`,
`user_id NULL`) count as votes and will therefore influence ranking. James confirmed this
is intended (A4).

Worth surfacing anyway: on a sparsely-tagged corpus, machine tags could dominate ranking
simply by being more numerous than human ones. **[decide]** whether to cap or weight
seeded contributions if `EXP-001` shows low human density.

## 8. Testing plan

**What exists:** nothing — `searchByTags` has no tests.

**What must exist:**

1. A restaurant with 500 votes on a matching tag ranks above one with 10
2. A restaurant with **zero** tags still appears in name search *(requirement 1)*
3. Zero-tag restaurants never outrank tagged ones on a tag query
4. Log damping behaves at the boundaries — 0, 1, 10, 500 votes
5. Seeded and human votes both count *(A4)*
6. Results are stable — the same query twice returns the same order
7. Ranking survives a tag being deleted mid-query without erroring

## 9. Deferred / future enhancements

- Semantic/embedding search over tags — `tags.embedding` already exists (512-dim,
  pgvector), so "romantic" could match "date night" without an exact tag. Real, and
  deliberately out of scope until basic ranking works.
- Personalised ranking from a user's own tag history
- Geographic relevance / "near me" ranking
- Filters (open now, price, cuisine) layered over the ranked set

---

## Open questions

1. **[decide]** Damping function — logarithmic (recommended), linear, or tiered?
2. **[decide]** Does distance participate in the score?
3. **[decide]** Should seeded tags be capped if human density turns out to be low?
4. **[unknown]** What is `/restaurants1`? It may already be an attempt at this.
5. **[blocked]** `EXP-001` — is there enough vote density for any of this to matter?
