---
id: DOC-016
type: changelog
status: active
phase: null
owner: james
tags: []
links: [DOC-005]
updated: 2026-07-23
---

# Changelog

**What shipped, when.** Append an entry when a roadmap item reaches `done` or a phase
completes. Newest first.

<!-- HOW TO USE
     One entry per shipped thing, not per commit. If a user or an operator would not
     notice it, it does not need an entry.
     Link the RM-## or PRD it closes so the trail runs: roadmap -> PRD -> changelog. -->

## Entry format

```markdown
## YYYY-MM-DD — Short title

**Closes:** RM-## · PRD-###
**Repos:** backend, web

- What changed, in plain language
- What changed
```

---

## 2026-07-23 — Docs system established

**Closes:** —
**Repos:** web

- Created the `/docs` knowledge base: frontmatter convention, controlled 14-tag
  vocabulary, ID scheme, and section mapping (`README-DOCS.md`)
- Wrote `PRD-001` — the first retroactive PRD, reconstructing restaurant tagging &
  voting from the code with every claim marked `[intended]`/`[inferred]`/`[unknown]`
- Wrote `ADR-001` — feature module isolation: 7 module boundaries, extraction order,
  and the API Resource prerequisite
- Added the comment-inbox loop (`scripts/sync-inbox.mjs`) and the living-docs generator
  (`scripts/refresh-docs.mjs`) with `npm run docs:refresh`

---

<!-- Entries below this line are RECONSTRUCTED from git history, not written at the
     time. Dates are commit dates and are reliable; the framing is mine. Correct
     anything that misrepresents what actually shipped. -->

## Reconstructed history

### 2026-06-10 — Admin docs dashboard
**Repos:** web
- Registry-driven documentation index at `/admin/docs`, reading local files and private
  repos via the GitHub Contents API
- Fixed doc rendering broken by the marked v18 token API

### 2026-06-05 — Backend security pass
**Repos:** backend
- Resolved a batch of P1/P2 findings — security, seeder hardening, schema (todos 032–062)
- Removed the temporary admin token generator route after use

### 2026-06 — Hosting migration to Railway
**Repos:** backend, web, marketing
- Laravel API live at `api.tastemakersapp.com`
- Web app live at `app.tastemakersapp.com` with Google OAuth admin login
- Supabase PostgreSQL provisioned, all services connected

### 2026-05 — AI tag-seeding pipeline built
**Repos:** backend
- Four services with 55 unit tests: Google Places, Anthropic (Claude Haiku),
  Voyage AI embeddings, and the seeder orchestrator
- pgvector similarity dedup on `tags.embedding`
- ⚠️ Built but never run at scale — the queued job and CLI command are still unbuilt

### 2021 — Original build
**Repos:** backend, ios
- Restaurant tagging & voting, discovery, tastemaker lists, social follows, photos,
  accounts, push notifications
- Shipped to the App Store (id 1573533249)
- See `PRD-001` and `launch-spec.md` for the reconstructed scope

<!-- TODO(james): the 2021 entries are coarse. If you remember the order features
     actually shipped in, split them out — the code cannot recover release boundaries. -->
