---
id: DOC-002
type: launch-spec
status: locked
phase: v1
owner: james
tags: [discovery, tagging, lists]
links: [PRD-001, DOC-003]
updated: 2026-07-23
---

# Launch spec — v1

> **🔒 Locked.** Nothing is added to the in-scope list without a PRD that clears the
> feature-intake gate (`feature-intake-rules.md`, DOC-003). The default answer to a new
> mid-cycle feature is **"not yet — log it in the roadmap."**
>
> Locking is the point. A launch spec you can edit freely is a wish list.

<!-- HOW TO USE THIS DOC
     The lists below are RECONSTRUCTED from the shipped code (archaeology, July 2026),
     not from an original 2021 spec — no original survives. They are proposals awaiting
     your confirmation in archaeology Step 2, where we draw the MVP boundary.
     Confirm, move, or delete each bullet. Delete this comment when done. -->

## Status of this document

🟡 **PARTIALLY CONFIRMED — 2026-07-23.** James recalled the original 2021 brief, which
confirms the top section below. The rest is still reconstruction from code.

> **The original brief, in his words:** *"build an iOS app with the tag review system
> integrated with the Foursquare API. It does have a badge system so users can go in
> there. I did have Google authentication integrated. We had an admin page that was a
> desktop browser."*

That single sentence resolves the biggest `[unknown]` in this archaeology — and it splits
the shipped product cleanly in two.

---

## In scope — what was actually briefed

**[intended] — confirmed by James.** These five were asked for.

- **Restaurant tagging & voting** ("the tag review system") — the core of the brief.
  → `PRD-001` ✅
- **Restaurant discovery via Foursquare** — venue search and detail. → PRD TODO
  ⚠️ Currently broken in production: `FOURSQUARE_API_KEY` unset on Railway.
- **Badge system** — users earn badges for tagging activity. → PRD TODO
  🔴 Currently broken: `getallBadges` hardcodes `user_id = 43`, so **every user sees user
  43's badges** (TASK-09). It also uses MySQL-only `IFNULL`, so it throws on Supabase
  (TASK-10). A briefed, shipped feature that is doubly broken.
- **Google authentication** — plus email signup and Apple sign-in, which arrived later.
  → PRD TODO
- **Admin panel (desktop browser)** — 50 live Blade routes. → PRD TODO

## Also shipped — but never briefed

**[unknown]** whether these were requested later or added by the contractor. They are
load-bearing today regardless, which makes the question worth answering.

- **Tastemaker lists** — create, edit, add restaurants, bookmark others'. → PRD TODO
  *(The feature the product is named after was not in the brief.)*
- **Social following** — follow a tastemaker, view their profile and lists. → PRD TODO
- **Restaurant photos** — upload, like, report, delete. → PRD TODO
- **Saving restaurants** — save a place to your profile. → PRD TODO
- **Push notifications** — device registration + send. → PRD TODO
- **Profile management** — view/edit profile, change password. → PRD TODO

## Out of scope — came later, or still missing

<!-- Split deliberately: "we chose not to" vs "we never got to" are different facts. -->

### Added after the initial build
- **Cuisine / category layer** — `pre_define_tags`, categories (May 2021, ~3 months later)
- **Public web app** — Next.js discovery pages (2026)
- **Admin/docs board** — internal only (2026)
- **AI tag seeding** — Claude Haiku + Voyage embeddings (2026, built but never run)

### Never built
- **Android app** — scaffold only; 4 files, zero screens
- **Any analytics on the core loop** — tag adds/views are not instrumented
- **Tag name normalisation** — free-text tag creation still fragments the vocabulary
- **Account deletion** — no endpoint exists → `PRD-002`
- **Vote-weighted search ranking** — vote counts drive tag colour only → `PRD-003`
- **Any revenue model** — no pricing, no payment code in any repo

### Deliberately excluded
<!-- TODO(james): anything you consciously decided NOT to build. The code cannot
     distinguish "decided against" from "never got to" — only you can.
     Everything above is in "never built" because I can't tell which it was. -->
- _TODO: fill in_

---

## Confirmed behaviour decisions

**[intended] — James, 2026-07-23.** Recorded here because the code alone reads as
ambiguous.

| Behaviour | Decision |
|---|---|
| **Browsing without an account** | Intended. Signed-out users can browse. The six endpoints moved outside `auth:api` were a product decision, not a shortcut. |
| **What an account adds** | Submitting tags, creating new tags, and clicking existing tags — all write operations stay authenticated. |
| **Untagged restaurants** | Still appear in search; they simply don't get ranked. → `PRD-003` req. 1 |
| **Machine-seeded tags** | Count as votes, same as human ones. → `PRD-001` §7 |

---

## Change log for this spec

| Date | Change | Why |
|---|---|---|
| 2026-07-23 | Created from code archaeology | No original spec existed |
