---
id: DOC-012
type: inbox
status: active
phase: null
owner: james
tags: []
links: [DOC-001]
updated: 2026-08-18
---

# Comment inbox

> **GENERATED — do not hand-edit.** Regenerate with `node scripts/sync-inbox.mjs`.
> Edit `docs/_comments.json` instead; this file is overwritten on every run.

**4 unresolved** — 1 change request · 2 questions · 1 note.

Read this at the start of every session. Act on change requests, answer questions,
then write a resolution so the item clears. See `README-DOCS.md` section 7.

---

## Change requests (1)

Asks for a change to a doc or to the code. **Act on these first.**

#### C-001 · `open` · on `PRD-001`

*james · 2026-07-23*

The vote-count ceiling is too low. Top tier is >=10 votes, so a tag with 10 votes and one with 500 render identically. Propose adding a level 0 for >=50, or showing the raw number once a tag passes some threshold.

---

## Questions (2)

Asks for information. Answer, then resolve with the answer as the note.

#### C-002 · `open` · on `DOC-008`

*james · 2026-07-23*

What is /restaurants1 actually for? If it is dead, it should be removed before the module extraction in ADR-001 rather than carried across.

#### C-003 · `in_review` · on `PRD-001`

*james · 2026-07-22*

Should machine-seeded tags count as votes? They currently land in the same table with user_id NULL and no read query filters on source.

---

## Notes (1)

Context with no action attached. Read and resolve, or leave for later.

#### C-004 · `open` · on `DOC-002`

*james · 2026-07-21*

The 'deliberately excluded' list in the launch spec is still empty. Only I can fill that in - the code cannot tell the difference between 'decided against' and 'never got to'.

---

## Recently resolved (1 of 1)

Kept briefly for context. These no longer need action.

#### C-005 · `resolved` · on `DOC-004`

*james · 2026-07-20*

The glossary entry for 'level' says it is a raw count, but the web client treats it as a 1-5 tier. One of these is wrong.

> **Resolved** 2026-07-23 by claude → `DOC-004`
> Both were right - the word means different things on each side of the API. Glossary entry rewritten to name the collision explicitly.

---

<!-- generated 2026-08-18T02:49:42.312Z by scripts/sync-inbox.mjs -->
