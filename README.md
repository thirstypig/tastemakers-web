# Tastemakers Web

Next.js 15 + TypeScript frontend for Tastemakers — public discovery pages and the
internal admin/docs board. Deployed on Railway at `www.tastemakersapp.com`.

```bash
npm install
npm run dev          # http://localhost:3050
npm test             # vitest
npm run type-check
```

<!-- DOCS:STATUS:START -->

## Current focus

_Generated 2026-08-18 by `npm run docs:refresh` — do not edit between these markers._

**Now:** RM-01 Finish the hosting migration · RM-02 Fix the P1 security backlog · RM-13 PostgreSQL compatibility sweep

**Next 3 to-dos:**

1. **TASK-01** (p1) — 🔴 **REVISED 2026-07-24 — already applied, not pending.** `UNIQUE (restaurant_id, tag_id)` is **live in production**. Drop it and replace with `UNIQUE (restaurant_id, tag_id, user_id)`. This stops the HTTP 500 on the second tagger (RISK-017) but **does not recover the deleted votes** — see TASK-18.
2. **TASK-18** (p1) — Attempt vote recovery: get a pre-migration dump of `restaurant_tag` from the legacy Namecheap MySQL host (cPanel → phpMyAdmin export, or any backup). The legacy DB was bound to `127.0.0.1` so it is unreachable remotely — this needs cPanel access. **Do it before the hosting is cancelled**, or the original vote counts are gone permanently.
3. **TASK-02** (p1) — Add an ownership check to `tastemaker_listdelete` — currently any authenticated user can delete any list by guessing an integer id

→ Full roadmap: [`docs/product/roadmap.md`](docs/product/roadmap.md)

<!-- DOCS:STATUS:END -->

## Documentation

This repo hosts the project's knowledge base, rendered by the admin board at
`/admin/docs`. Start with **[`docs/README-DOCS.md`](docs/README-DOCS.md)** — it explains
the frontmatter convention, the tag vocabulary, and how the generated docs work.

| Command | What it does |
|---|---|
| `npm run docs:refresh` | Regenerates stats, costs, system status, and the status block above |
| `npm run docs:inbox` | Regenerates `docs/INBOX.md` from `docs/_comments.json` |

**Run `npm run docs:refresh` before every push** so the board shows what is actually true.

| Where | What |
|---|---|
| [`docs/product/`](docs/product/) | PRDs, roadmap, to-dos, launch spec, glossary |
| [`docs/engineering/`](docs/engineering/) | ADRs, tech spec, API docs, testing strategy |
| [`docs/under-the-hood/`](docs/under-the-hood/) | Generated stats, costs, status, runbook, risks |
| [`docs/solutions/`](docs/solutions/) | Solved problems — check here before debugging |
