---
id: PRD-004
type: prd
status: active
shipped: true
phase: null
owner: james
tags: [social, backend, ios]
links: [PRD-001, DOC-002, DOC-017, RM-02]
updated: 2026-07-24
---

# Badges

> **Retroactive PRD.** The feature shipped in 2021 and was in the original brief.
> Reconstructed from code on 2026-07-23.
> **[intended]** deliberate · **[inferred]** read from code · **[unknown]** ask James.

> ### 🔴 This feature is broken *and* empty in production
> `getallBadges` hardcodes `user_id = 43` — **every user sees user 43's badges.**
>
> **And `badge_categories` has 0 rows** (verified 2026-07-24). No category badge can
> ever be awarded, because there are no categories. The only thing any user has ever
> seen is the hardcoded "Tastemaker Badge" injected at index 0 of every response.
>
> So the `≥10 restaurants` rule in §6 has never fired, for anyone. See §9.

---

## 1. Problem statement

Tagging a restaurant is a small, unrewarded act. Nothing acknowledges the person who
tagged 200 places, and nothing distinguishes them from someone who tagged one.

Badges give tagging activity a visible return. **[inferred]** — the problem statement is
reconstructed; what's certain is that badges were asked for.

**Who:** users who contribute tags, i.e. the supply side of the whole product.

## 2. Strategic rationale

**[intended] — confirmed by James, 2026-07-23.** The 2021 brief included *"a badge
system so users can go in there."* It was asked for by name.

The strategic logic **[inferred]**: Tastemakers only works if enough people tag the same
restaurant (`PRD-001` §4, A1). Tagging is unpaid work. Badges are the cheapest available
incentive — no money, no moderation, just recognition.

If that reading is right, badges are not decoration. They are the **supply-side
incentive for the core loop.** Which makes it worse that they've been broken.

## 3. User story

> As someone who tags a lot of restaurants, I want visible recognition of what I've
> contributed, so that the effort feels worth repeating.

> As someone viewing a tastemaker's profile, I want to see what they've earned, so I can
> judge whether to trust their taste.

The second one matters: `review_count` accepts an `other_userid`, so badges were built to
be viewed **on other people's profiles** — they're a credibility signal, not just a
private trophy shelf. **[inferred]**, from the endpoint shape.

## 4. Assumptions

| # | Assumption | Status |
|---|---|---|
| A1 | Recognition motivates continued tagging | **[unknown]** — never measured. No event fires when a badge is earned or viewed. |
| A2 | 10 restaurants per category is the right threshold | **[unknown]** — hardcoded as `>= 10` with no derivation anywhere |
| A3 | Category-based badges match how people actually explore | **[inferred]** — badges piggyback on `badge_categories`/`category_restaurant`, which is the cuisine layer added in May 2021, *after* the initial build |
| A4 | Users notice badges at all | **[unknown]** — depends on iOS surfacing, unverified |

## 5. Impact & KPIs

### (a) What the metric *should* be

| Metric | Why |
|---|---|
| Tagging rate before vs. after first badge earned | The whole bet: does recognition drive supply? |
| % of active users holding ≥1 category badge | Is the threshold reachable, or is it decorative? |
| Distribution of tags-per-user | Badges should fatten the middle, not just reward existing heavy users |
| Badge views on *other* people's profiles | Tests the credibility-signal reading in §3 |

### (b) What we can measure today

**Not instrumented — and worse than that, currently unmeasurable in principle.**

Because `getallBadges` returns user 43's badges to everyone, any analytics gathered from
that endpoint would describe one person. Even if events existed, the data would be wrong.

## 6. Technical notes — how it's actually built

### The rules, as implemented

| Badge | Earned when |
|---|---|
| **Tastemaker Badge** | Always granted. Injected at index 0 of every response, dated to the user's account creation. Everyone has it from signup. |
| **Category badges** | Tagging **≥ 10 distinct restaurants** within one `badge_categories` category |

Unearned badges return a `grey_badge_image` rather than being omitted — so the UI shows
the full set with locked ones greyed out. **[intended]** — that's a deliberate product
choice, and a good one.

### Data

`badge_categories` — `category_id`, `category_name`, `badge_image`, `grey_badge_image`.
**No migration exists for this table.** It was created directly in the database, like
`testmaker_list` and `restaurant_images`.

Badge counts are derived at request time from `restaurant_tag` joined through
`category_restaurant`. Nothing is stored — a badge is a query result, not a record. That
means **there is no "earned" event and no earned-at timestamp**; the date shown is
inferred from the 10th qualifying tag's `created_at`.

### Three implementations of one feature

| Function | Lines | Status |
|---|---|---|
| `getallBadges` | 83 | Routed (`POST /getallBadges`, **public**) — hardcoded to user 43 |
| `review_count` | 116 | Routed (`GET /review_count`) — takes `other_userid` from the body |
| `review_count1` | **125** | **Not routed anywhere.** Dead code. |

**324 lines across three implementations of one periphery feature.** For comparison, the
entire tagging write path — the core value proposition — is **90 lines**.

### Assets

Badge images are served from a filesystem path: `URL::to('/') . "/assets/media/badge/"`.
**[inferred] risk:** Railway's filesystem is ephemeral. If those files aren't in the repo,
badge images are broken in production. Not verified — see §9.

## 7. AI implementation notes

Not applicable.

## 8. Testing plan

**What exists: nothing.** Zero tests across all three implementations.

**What should exist:**

1. A user sees **their own** badges — the test that would have caught the `43` bug
2. Two different users get different badge sets
3. Tagging the 10th restaurant in a category earns that badge; the 9th does not
4. Unearned badges return `grey_badge_image`
5. The Tastemaker Badge is present for a brand-new user with zero tags
6. Tagging the *same* restaurant 10 times does **not** earn a badge (distinct restaurants)
7. The response contains no MySQL-only SQL — it runs on PostgreSQL
8. A user with no tags gets a valid response, not a 500

## 9. What we'd do differently

**1. 🔴 The hardcoded user.** `getallBadges` calls `Auth::user()`, assigns it to `$user`,
never uses it, and then filters on `user_id = 43` in **three** separate queries. Every
caller receives user 43's badges. A single test asserting "two users see different
badges" would have caught it. → **TASK-09**

**2. 🔴 It runs on a public route.** `POST /getallBadges` sits outside `auth:api`. Under
the rule confirmed in `DOC-008` — reads may be public, writes are always authenticated —
a read endpoint being public is fine. But a *personalised* read endpoint cannot be public
and correct at the same time. The hardcoded `43` is arguably what makes the public route
"work": with real auth scoping it would return nothing for an anonymous caller. **The bug
and the routing are load-bearing for each other**, so fixing one requires fixing both.

**3. 125 lines of dead code.** `review_count1` is unrouted and unreachable. It also
references `$data` in a scope where `$data` is never assigned — **it would fatal if it
were ever called.** It is larger than the entire tagging feature. Delete it.

**4. Duplicated branches that do the same thing.** Inside `review_count1`:
`if ($x == "") { $r = $x; } else { $r = $x; }` — both arms identical. Twice.

**5. MySQL-only SQL.** `IFNULL` in the badge queries throws on PostgreSQL, so this
feature **breaks on Supabase** regardless of the other bugs. → TASK-10, RISK-011

**6. Badges are computed, never recorded.** No earned-at timestamp, no event. You cannot
answer "when did badge adoption change?" retrospectively, and the displayed date is
reverse-engineered from tag timestamps. If badges are the supply-side incentive (§2),
this is the data you'd most want.

**7. `other_userid` from the request body.** `review_count` reads it unauthenticated-ly
from the body. Badge data is arguably public, so this is lower severity than TASK-02/03 —
but it's the same pattern that produced both of those.

**8. No migration.** `badge_categories` exists only in the database. → TASK-14

---

## Open questions

1. **[unknown]** Where did the "10 restaurants" threshold come from? Was it ever tuned?
2. **[unknown]** Does the iOS app surface badges prominently, or are they buried?
3. **[unknown]** Are the badge image assets committed to the repo, or were they uploaded
   to the old Namecheap server? If the latter, they're already gone.
4. **[unknown]** How long has the `43` bug been live? If since 2021, no user has ever seen
   their own badges.
5. **[decide]** Should earning a badge be recorded as an event, rather than recomputed?
