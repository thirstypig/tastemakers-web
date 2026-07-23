# Tastemakers Web

Next.js 15 + TypeScript frontend for Tastemakers — public discovery pages and the
internal admin/docs board. Deployed on Railway at `app.tastemakersapp.com`.

```bash
npm install
npm run dev          # http://localhost:3050
npm test             # vitest
npm run type-check
```

<!-- DOCS:STATUS:START -->

## Current focus

_Generated 2026-07-23 by `npm run docs:refresh` — do not edit between these markers._

**Now:** RM-01 Finish the hosting migration · RM-02 Fix the P1 security backlog · RM-13 PostgreSQL compatibility sweep

**Next 3 to-dos:**

1. **TASK-01** (p1) — Change the pending `restaurant_tag` unique constraint from `(restaurant_id, tag_id)` to `(restaurant_id, tag_id, user_id)` — as written it deletes every vote and 500s on popular tags
2. **TASK-02** (p1) — Add an ownership check to `tastemaker_listdelete` — currently any authenticated user can delete any list by guessing an integer id
3. **TASK-03** (p1) — Replace body `user_id` with `Auth::id()` in `tagsdelete` — the add path authenticates, the delete path doesn't

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
