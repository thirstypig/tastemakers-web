---
id: DOC-004
type: glossary
status: draft
phase: null
owner: james
tags: []
links: [PRD-001]
updated: 2026-07-23
---

# Glossary

**Define every project-specific term, acronym, and persona here.**

The test for inclusion: if a new person read the codebase and would guess wrong, it
belongs here. Especially true for terms that mean something different inside this
project than outside it — `level` and `tastemaker` both do.

<!-- HOW TO USE
     Three example rows are filled in below to show the format. Everything else is
     yours to add. Keep definitions to 1-2 sentences; link to the PRD or ADR that
     explains the concept in depth rather than explaining it twice. -->

---

## Product terms

| Term | Definition | See also |
|---|---|---|
| **Tastemaker** | A user whose curated lists other people follow. Not a separate account type — any user becomes one by creating lists others bookmark. **[inferred]** — no `is_tastemaker` flag exists in the schema. | PRD TODO |
| **Tag vote** | One row in `restaurant_tag`, representing one user applying one tag to one restaurant. The count of these rows *is* the tag's rank. There is no separate counter column. | `PRD-001` |
| **Level** | ⚠️ **Means two different things.** In the **backend** it is the raw vote count (`count(restaurant_tag.tag_id) AS level`) — unbounded. In the **web and iOS clients** it is a 1–5 tier derived from that count (≥10→1, ≥5→2, ≥3→3, ≥2→4, else 5) that drives colour and font weight. Same word, different type, no conversion marked at the boundary. | `PRD-001`, DOC-011 |
| _TODO_ | _Curated list / Tastemaker list — define_ | |
| _TODO_ | _Canonical tag — define (relates to the AI seeding dedup)_ | |
| _TODO_ | _Pre-defined tag — how does it differ from a normal tag?_ | |

## Personas

| Persona | Who they are | What they need |
|---|---|---|
| _TODO_ | _The diner choosing where to eat_ | |
| _TODO_ | _The tastemaker curating lists_ | |

## Technical terms

| Term | Definition | See also |
|---|---|---|
| **`place_id`** | Google Places identifier, used as the natural key for a restaurant. Restaurants are created on first tag if the `place_id` is unseen. | `PRD-001` §6 |
| _TODO_ | _`source` on tags/restaurant_tag — `google_seed` vs `user`_ | |
| _TODO_ | _Seeded tag vs human tag_ | |

## Naming inconsistencies to be aware of

| You'll see | It means | Note |
|---|---|---|
| `testmaker`, `testmaker_list` | tastemaker | Misspelling throughout the 2021 codebase — 228 occurrences. Not a different concept. |
| `restaurants` and `restaurants1` | two live discovery endpoints | **[unknown]** whether `restaurants1` is a replacement, an experiment, or abandoned. |
