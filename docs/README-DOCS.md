---
id: DOC-001
type: guide
status: active
phase: null
owner: james
tags: [foundations]
links: [ADR-001]
updated: 2026-07-23
---

# How this doc system works

This is the map. Read it first.

Every authored document opens with a YAML frontmatter block. That one block is what
makes the admin board work — it drives the section a doc lands in, its status badge,
the search index, the "done" filter, and the cross-links between docs.

**No frontmatter, no index.** A doc without it is invisible to the board.

---

## 1. The frontmatter block

Copy this into the top of every authored doc. It must be the very first thing in the
file — no blank line, no comment above it.

```yaml
---
id: PRD-001                 # stable ID — never reused, never renumbered
type: prd                   # see the type table in §3
status: draft               # draft | active | locked | done | deprecated
phase: null                 # build phase this relates to, or null
owner: james
tags: []                    # ONLY from the controlled vocabulary in §4
links: []                   # IDs of related docs — this is traceability
updated: 2026-07-23         # YYYY-MM-DD, bump when you meaningfully edit
---
```

### Field reference

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Stable forever. If a doc is superseded, the new doc gets a new ID and the old one goes `status: deprecated` with a `links` pointer to its replacement. Never recycle a number. |
| `type` | yes | Determines which board section the doc appears in. Pick from §3. |
| `status` | yes | Drives the badge and the "done" filter. See §2. |
| `phase` | no | Free text or `null`. Use when a doc belongs to a named build phase. |
| `owner` | yes | Currently always `james`. Kept because it stops being trivial the moment a second person touches this. |
| `tags` | yes | Array, may be empty. **Controlled vocabulary only** — see §4. |
| `links` | yes | Array of IDs, e.g. `[PRD-003, ADR-001]`. May be empty. This is how the board draws relationships. |
| `updated` | yes | `YYYY-MM-DD`. |

### Optional fields

| Field | Used by | Notes |
|---|---|---|
| `priority` | todos, risks | `p1` \| `p2` \| `p3`. Preserves the existing `todos/` convention so 180 files don't need rewriting. |
| `shipped` | PRDs only | `true` \| `false`. Renders the shipped-vs-planned badge. A retroactive PRD for live code is `shipped: true`; a forward-looking one is `false`. |

---

## 2. Status — and the "done" convention

| Status | Meaning |
|---|---|
| `draft` | Being written. Incomplete by design. |
| `active` | Current and trustworthy. The default for a finished doc. |
| `locked` | Deliberately frozen. Changing it requires a process — see `product/feature-intake-rules.md`. |
| `done` | The work this doc describes is finished. |
| `deprecated` | Superseded or no longer true. Kept for history, not for guidance. |

**Nothing moves to a separate file or folder when it's finished.** "Done" is just
`status: done`, surfaced as a saved filter on the board.

Archive folders rot because nobody remembers to look in them. A filter can't rot.

---

## 3. Types → board sections

The board organises by **the question a reader is asking**, not by folder. A doc's
`type` decides its section, so a file's location on disk is a convenience, not a
constraint. Sections run most-referenced first, foundations last.

| Section | `type` values | The question it answers |
|---|---|---|
| **📥 Inbox** *(pinned top)* | `inbox` | What needs my attention right now? |
| **Product** | `prd`, `launch-spec`, `intake-rules`, `roadmap`, `todos` | What are we building, and why? |
| **Marketing** | `marketing` | Who is it for, what does it cost, how do they find it? |
| **Engineering** | `adr`, `tech-spec`, `api-docs`, `decision-log`, `testing`, `component-lib` | How is it built? |
| **Security** | `security` | Where are we exposed? |
| **Operations** | `stats`, `costs`, `status`, `runbook`, `changelog`, `risk`, `experiment`, `privacy` | Is it healthy, what does it cost, what do I do at 3am? |
| **Prompt Library** | `prompt` | What prompts does the product actually run? |
| **Troubleshooting** | `solution` | I hit this problem — has it been solved before? |
| **Foundations** | `glossary`, `guide`, `context`, `design-system` | What do these words mean, how do I work here? |
| **Notes** | `note` | Scratchpad. Not authoritative. |

A small `path → section` override map handles exceptions. Use it sparingly — if you
need many overrides, the `type` vocabulary is wrong, not the file.

---

## 4. Controlled tag vocabulary

**14 tags. That is the whole list.** No freeform tags — the moment anyone invents one,
search rots and the tag filter becomes noise.

Adding a 15th is a deliberate decision, recorded in `engineering/decision-log.md`. The
bar: it must be a filter you would actually reach for more than once.

### Domain — which part of the product

| Tag | Covers |
|---|---|
| `tagging` | The tag + vote system. The core value prop. |
| `discovery` | Browse, search, restaurant detail, cuisine, nearby. |
| `lists` | Tastemaker lists, list contents, bookmarks. |
| `social` | Follows, tastemaker profiles, badges, review counts. |
| `photos` | Restaurant image upload, likes, reporting, moderation. |
| `accounts` | Signup, login, OAuth, password reset, profile. |

### Platform — where it lives

| Tag | Covers |
|---|---|
| `backend` | Laravel API. |
| `ios` | Swift/UIKit app. |
| `web` | Next.js app + admin board. |
| `android` | Kotlin app. *(Currently a scaffold — tag exists for roadmap docs.)* |

### Concern — cuts across everything

| Tag | Covers |
|---|---|
| `security` | Auth, authorization, IDOR, secrets, exposure. |
| `data-model` | Schema, migrations, tables, relationships. |
| `ai` | LLM calls, embeddings, tag seeding pipeline, prompts. |
| `infra` | Hosting, deploys, DNS, Railway, Supabase, env config. |

**Guidance:** most docs want 2–4 tags — typically one domain, one platform, one
concern. Tagging everything with everything is the same as tagging nothing.

There is deliberately **no `foundations` domain tag** beyond its use on this doc and
other wayfinding pages; foundations is a *section*, derived from `type`.

---

## 5. ID scheme

One number block per section. Allocated sequentially, never reused.

| Prefix | For | Lives in |
|---|---|---|
| `PRD-###` | Product requirement docs | `product/prds/` |
| `ADR-###` | Architecture decisions (big, costly to reverse) | `engineering/adrs/` |
| `DOC-###` | General authored docs | anywhere |
| `RISK-###` | Entries in the risk register | `under-the-hood/risks-register.md` |
| `EXP-###` | Experiments closing a PRD hypothesis | `under-the-hood/experiment-log.md` |
| `SOL-###` | Solved problems | `solutions/` |
| `TODO-###` | Code-review findings | `todos/` (reuses existing `issue_id`) |
| `RM-##` | Roadmap items (macro) | `product/roadmap.md` |
| `TASK-##` | To-do items (micro) | `product/todos.md` |

`RM-##` and `TASK-##` identify *rows inside* a doc, not files. They exist so a to-do
can point at the roadmap item it serves and a PRD can point back — that trail is the
whole reason the ids are stable.

**ADR vs decision-log:** an ADR is for decisions expensive to reverse — framework,
database, auth model, module boundaries. Everything smaller is a one-line entry in
`engineering/decision-log.md`: date · decision · why. If you're unsure, it's a
decision-log entry.

---

## 6. Living docs (generated — do not hand-edit)

Three docs are regenerated from real data by `npm run docs:refresh`:

- `under-the-hood/stats.md`
- `under-the-hood/costs.md`
- `under-the-hood/system-status.md`

**Edit the inputs, not the output.** Costs are driven by `docs/costs.config.json`.
Run the refresh before every push, so what the board shows is what's true.

A fourth doc, `INBOX.md`, is generated separately by `node scripts/sync-inbox.mjs` from
`docs/_comments.json`. Same rule: edit the input, never the output.

---

## 7. Comment inbox

Comments are how a doc gets challenged without being silently rewritten. Someone leaves
a comment on a doc; it lands in `INBOX.md`; it gets acted on and resolved.

### The comment model

| Field | Values | Notes |
|---|---|---|
| `id` | `C-###` | Stable, never reused |
| `doc` | a doc id | Which doc the comment is on — `PRD-001`, `ADR-001`, … |
| `kind` | `question` \| `change_request` \| `note` | See below |
| `status` | `open` → `in_review` → `resolved` | One direction only |
| `author` | who wrote it | |
| `created` | ISO 8601 timestamp | |
| `body` | the comment text | |
| `resolution` | `null`, or `{note, link, resolved, by}` | Required to reach `resolved` |

**Kinds — they get different treatment, which is why the distinction matters:**

| Kind | Means | Handling |
|---|---|---|
| `change_request` | Asks for a change to a doc or the code | **Rendered at the top of the inbox.** Act on these first. |
| `question` | Asks for information | Answer it, then resolve with the answer as the resolution note. |
| `note` | Context, no action attached | Read it. Resolve or leave. |

**Statuses:**

- `open` — nobody has picked it up.
- `in_review` — being worked on. Prevents two passes at the same item.
- `resolved` — done. **Requires a `resolution`**: a short note saying what happened, and
  a `link` — a commit SHA if code changed, or a doc id if a doc changed.

A resolution without a link is a resolution nobody can verify. That's the whole value of
the field.

### The session ritual

**At the start of a session, read `docs/INBOX.md`.**

1. Act on `change_request` items first — they're at the top for that reason.
2. Answer `question` items.
3. Write a resolution for each one you handled: set `status: resolved`, add a note and a
   link.
4. Re-run `node scripts/sync-inbox.mjs` so the item clears and shows as resolved.

Anything you can't resolve stays `open` — that's a legitimate outcome, not a failure.
An inbox that only ever empties by fiat is worse than one that carries honest debt.

### Where the data lives

`INBOX.md` is **generated**. Never hand-edit it — it's overwritten on every run.

Comments currently live in `docs/_comments.json`, a local stub, so the loop works today.
The real source will be a `doc_comments` table in Supabase once the admin board can post
comments. Swapping it is a single function in `scripts/sync-inbox.mjs` — see the TODO at
the top of that file. Nothing downstream changes.

---

## 8. Legacy compatibility

Existing docs predate this convention. They are **not** being rewritten wholesale.

| Existing thing | How it maps |
|---|---|
| `todos/*.md` — has `status: pending\|complete`, `priority`, `issue_id`, `dependencies` | `pending` → `active`, `complete` → `done`. `issue_id` → `TODO-###`. `dependencies` → `links`. `priority` kept as-is. |
| `solutions/*.md` | `type: solution`, gets a `SOL-###`. |
| Per-repo `CLAUDE.md` | `type: context`. Indexed read-only — these are agent instructions, not wiki pages. |
| `superpowers/plans\|specs` | `type: note` unless deliberately promoted to a real doc. |

Docs with no frontmatter still render if opened directly, but they **do not appear in
any section** and **do not appear in search**. Adding frontmatter is how a legacy doc
joins the system.

---

## 9. Rules

1. Frontmatter is the first thing in the file. Always.
2. Tags come from §4. Never invent one inline.
3. IDs are never reused, never renumbered.
4. Generated docs (§6) are never hand-edited.
5. Superseded docs go `deprecated` with a `links` pointer — they are not deleted.
6. `updated` gets bumped when the content meaningfully changes, not for typos.
