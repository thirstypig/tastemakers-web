---
id: PRD-001
type: prd
status: active
shipped: true
phase: null
owner: james
tags: [tagging, backend, ios, data-model]
links: [ADR-001, TODO-067, TODO-006, TODO-037]
updated: 2026-07-23
---

# Restaurant tagging & voting

> **This is a retroactive PRD.** The feature shipped in 2021, built by a contractor.
> It was reconstructed from the code in July 2026, not written before the build.
> Every claim below carries an honesty tag:
>
> - **[intended]** — plausibly a deliberate up-front decision, with the reason given.
> - **[inferred]** — a reasonable read of the code, not a known fact.
> - **[unknown]** — the code cannot tell us. These are questions for James, not gaps to fill.

---

## 1. Problem statement

Restaurant ratings are a single number that flattens every reason a place might be
right or wrong for you. A 4.2 doesn't tell you whether somewhere is loud, good for a
first date, or worth the queue. **[inferred]** — this is the problem the data model
implies; no written brief survives.

Tastemakers replaces the star with **descriptive tags applied by many users**, where
the number of people who applied a tag is the signal. "Would Recommend ×50" says
something a single reviewer's five stars cannot.

**Who:** people choosing where to eat, who already know a place is *good* and need to
know whether it's right *for this occasion*. **[inferred]**

## 2. Strategic rationale

Tags-as-votes is the credibility mechanism of the platform. **[intended] — confirmed by
James, 2026-07-23.** The original 2021 brief to the contractor was: *"build an iOS app
with the tag review system integrated with the Foursquare API,"* plus a badge system,
Google authentication, and a desktop admin page.

So this is not reconstruction. **The tag review system was the brief.** The structural
evidence agrees: `restaurant_tag` was created in the very first product migration
(`2021_02_24_121106`), the same day as `restaurants` and `tags` themselves.

Worth noting what the brief did **not** include: tastemaker lists, social following, and
photos. Those are load-bearing features today (see `launch-spec.md`) that were never
asked for — they arrived during the build or after it. **[unknown]** whether they were
requested later or added by the contractor.

The vote count is surfaced as `level` and sorts every tag list in the product.
**[intended]** — four separate queries in `Restaurant.php` independently
`ORDER BY level DESC`. Somebody meant that.

**Why it was worth building:** tags are cheap for a user to give (one tap) and
compound in value as more people give them. **[inferred]**

## 3. User story

> As someone deciding where to eat, I want to see which descriptions other diners
> agreed on for a restaurant, so that I can judge whether it fits my occasion rather
> than just whether it's good.

> As a diner who's been somewhere, I want to tag it in one tap, so that I contribute
> without writing a review.

**[inferred]** — reconstructed from the API shape (one POST carries a comma-separated
tag list; there is no review body field anywhere).

## 4. Assumptions the build implicitly bet on

These were never written down. The code bets on them regardless.

| # | Assumption | Status |
|---|---|---|
| A1 | Enough users will tag the same restaurant for counts to mean anything. A tag with one vote is noise. | **[unknown]** — never validated; no data on tag density per restaurant. |
| A2 | Users will converge on similar words unprompted. | **[inferred]** — the code bets *against* this: `pre_define_tags` (May 2021) was added three months later to suggest tags, and the 2026 AI seeding pipeline exists to normalise them. Both are corrections to A1/A2 failing. |
| A3 | Free-text tag creation won't fragment the vocabulary. | **[inferred]** — **this bet lost.** `Tag::firstOrCreate(['name' => $tag])` does no normalisation, so `Date Night`, `date night`, and `date-night` are three tags with one vote each instead of one tag with three. |
| A4 | One vote per user per restaurant-tag is the right unit. | **[intended]** — enforced in code via a duplicate check before insert. |

## 5. Impact & KPIs

### (a) What the metric *should* be

If tags-as-votes works, these move. **[inferred]** — these are the bets I'd have made;
none were stated at build time.

| Metric | Why it's the right one |
|---|---|
| **Median votes per tag, per restaurant** | The core health metric. Below ~3 the ranking is meaningless — you're showing one person's opinion as consensus. |
| **% of restaurants with ≥1 tag** | Coverage. An untagged restaurant is a dead end. |
| **Distinct taggers per restaurant** | Distinguishes real consensus from one enthusiast tagging everything. |
| **Tag vocabulary concentration** | What share of votes land on the top 50 tags. Falling concentration = A3 failing = vocabulary fragmenting. |
| **Tag → save/list-add conversion** | Does seeing tags actually change a decision? This is the one that proves the value prop. |

### (b) What we can measure *today*

**Not instrumented.** Plainly: there is no analytics event fired on tag add, tag view,
or tag-driven navigation anywhere in the backend or iOS app.

- PostHog exists but was added in 2026 and covers the **web** app only.
- The counts in §5(a) are all *derivable by SQL* against `restaurant_tag` — nobody is
  running those queries, and no dashboard shows them.
- Production database is currently **empty**; live data still sits on the legacy
  Namecheap MySQL host. So even the SQL route needs the migration finished first.

**No numbers are given here because there are none.** Anything quoted would be invented.

## 6. Technical notes — how it's actually built

**Data model.** One row in `restaurant_tag` per `(restaurant, tag, user)`. The vote
count *is* the row count — there is no counter column.

```
restaurant_tag: restaurant_id, tag_id, user_id (nullable since 2026-05-14), source
tags:           name, embedding vector(512), canonical_tag_id, source, expires_at
```

**Read path.** `Restaurant.php` — the ranking query:

```sql
SELECT tags.id, tags.name, count(restaurant_tag.tag_id) AS level
  FROM restaurant_tag JOIN tags ON tags.id = restaurant_tag.tag_id
 WHERE restaurant_tag.restaurant_id = ?
 ORDER BY level DESC
```

This query appears **four times** in the same file (lines 41, 54, 66, 78), copy-pasted
with small variations. **[inferred]** — not a decision, just duplication.

**Write path.** `RestaurantController::tagsRestaurant` (~line 1240):

1. Accepts `tags` as a **comma-separated string**, then `explode(',')`.
2. `Tag::firstOrCreate(['name' => $tag])` — creates the tag if it doesn't exist. No
   trimming, no case folding, no normalisation.
3. Checks `if (!Auth::user()->restaurantTags($rid, $tid)->first())` — a SELECT before
   INSERT, to stop one user double-voting.
4. `$restaurant->tags()->attach($allTagIds)` with `user_id` from `Auth::user()->id`.

**A notable side effect:** this endpoint *creates the restaurant* if `place_id` doesn't
match an existing row (`CurModel::create($validateData)`). Tagging is also the
restaurant-ingestion path. **[inferred]** — likely convenience, but it means the
restaurant corpus is a by-product of tagging rather than a curated dataset.

**Client coverage:** backend ✅ · iOS ✅ · web ✅ (read + write via
`/api/restaurants/[id]/tag`) · Android ❌ (no app exists).

## 7. AI implementation notes

Not part of the 2021 build. A 2026 pipeline now generates tags automatically:

| Service | Model | Purpose |
|---|---|---|
| `GooglePlacesService` | — | Fetch venue reviews + editorial summary |
| `AnthropicService` | `claude-haiku-4-5` | Extract candidate tags from review text |
| `EmbeddingService` | `voyage-3.5-lite`, 512-dim | Embed tags for similarity |
| `TagSeederService` | — | Orchestrate; pgvector cosine dedup at ≥ 0.85 |

Seeded rows carry `source: google_seed` and `user_id: NULL`, expiring after 90 days.

**Cost per call: [unknown].** Not measured, not budgeted, not recorded anywhere.

**Status: built but never run.** The queued job (`SeedRestaurantTagsJob`) and the
`tags:seed` command are both unbuilt — todos 034 and 035. Four services with 55 passing
unit tests and no way to invoke them at scale.

**A design tension, now resolved:** seeded tags enter the same `restaurant_tag` table as
human votes. A seeded tag has `user_id: NULL` but still counts as a row, so it counts as
a **vote** in the `level` query. Machine-generated tags therefore contribute to the
consensus signal.

**[intended] — confirmed by James, 2026-07-23: seeded tags counting as votes is fine.**

Two consequences follow, and both are now live decisions rather than accidents:
- Once ranking uses vote counts (`PRD-003`), machine tags will influence discovery. On a
  sparsely-tagged corpus they could outnumber human ones — see `PRD-003` §7.
- `restaurant_tag.user_id IS NULL` now means "machine-seeded" **and nothing else**, which
  is why `PRD-002` must not use null to anonymise a deleted user's votes.

## 8. Testing plan

**What exists:**
- 55 unit tests across the four 2026 AI services (Anthropic 13, Embedding 13, Places 12, Seeder 17). All green.
- **Zero tests on the tagging feature itself** — nothing covers `tagsRestaurant`, `tagsdelete`, or the `level` ranking query.

**What should exist:**
1. The `level` query returns tags ordered by distinct vote count.
2. The same user tagging twice does **not** increment the count.
3. Two *different* users applying the same tag **does** increment it. *(This is the test that would have caught TODO-067.)*
4. A user can only delete their own vote.
5. Case/whitespace variants of a tag name resolve to one tag.
6. Seeded (`source: google_seed`) vs. human votes are distinguishable in output.

## 9. What we'd do differently

Candidly, from the code:

**1. Normalise tag names at write time.** `firstOrCreate` on raw user input guaranteed
vocabulary fragmentation from day one. The 2026 embedding-similarity pipeline is an
expensive fix for a problem a `trim()` + `strtolower()` would have largely prevented.
Fixing it now needs a backfill and a `UNIQUE(name)` constraint — TODO-037.

**2. The delete path trusts the client.** `tagsdelete` validates
`"user_id" => "required"` and takes it **from the request body**, while the add path
correctly uses `Auth::user()->id`. The same feature authenticates one direction and not
the other — any user can delete any other user's vote by passing their id. Related to
TODO-006, but this is a distinct, concrete instance.

**3. Never instrumented.** The central metric of the product — do tags actually change
where people eat — has never been measurable. Five years of tag data with no analysis path.

**4. 🔴 A pending migration would destroy the feature.** `2026_06_04_000001_add_unique_constraint_to_restaurant_tag.php`
deletes duplicate `(restaurant_id, tag_id)` rows and adds `UNIQUE(restaurant_id, tag_id)`.
Those "duplicates" **are the votes.** Applying it collapses every count to 1 and makes
the second user to apply a popular tag hit a 500. It is committed and unapplied.
See TODO-067. The correct constraint is `UNIQUE(restaurant_id, tag_id, user_id)`.

**5. The duplicate check races.** SELECT-then-INSERT under concurrency lets two
simultaneous requests both pass the check and both insert — self-double-voting.
Only a DB-level constraint fixes it. TODO-037.

**6. Four copies of the ranking query.** Any change to how votes are counted must be
made in four places, and a future module extraction has to reconcile all four.

---

## Open questions for James

1. **A1 — was tag density ever checked?** Do real restaurants have 5 votes on a tag, or 1?
2. ~~**Does the UI show vote counts?**~~ **Answered 2026-07-23 by the code.** No number is
   ever shown. `TagChip` accepts `showCount` but it defaults to `false` and is **never
   passed as `true` anywhere in the app**. Instead the count maps to a 1–5 tier
   (`voteCountToLevel()`) that drives colour, font weight, and opacity — ported from iOS
   `ColorExtension.swift`, so both clients behave the same. **[intended]** — the colour
   ramp is deliberate and cross-platform.
   **Follow-up, answered 2026-07-23:** the top tier is "≥10 votes," so a tag with 10
   votes and one with 500 render identically. James: *"the one with 500 votes should get
   more relevance in a search."* → the fix is **ranking, not colour** — now `PRD-003`.
3. ~~**Should machine-seeded tags count as votes?**~~ **Answered 2026-07-23: yes.**
   Recorded as intended in §7.
4. **Was free-text tagging deliberate**, or did `pre_define_tags` (May 2021) arrive because it wasn't working?
5. **Were tastemaker lists, follows, and photos requested**, or added by the contractor?
   None were in the original brief (§2).

### Deliberately parked

**A1 — tag density.** James, 2026-07-23: leave it unknown for now. The data lives only on
the legacy host. Captured as `EXP-001` so it can be answered later; see the note there
about running it **before** that host is decommissioned. Related requirement he did give:
*an untagged restaurant should still appear in search, it just doesn't get ranked* — now
`PRD-003` requirement 1 / TASK-11.
