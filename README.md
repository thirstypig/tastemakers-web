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
2. **TASK-19** (p2) — Old numeric URLs (`/restaurants/159`) do not 301 to the canonical slug. `permanentRedirect` never fires — streaming commits a 200 before the page resolves. Needs middleware.
3. **TASK-20** (p1) — Photo upload is off. `restaurant-image-save` writes to `public_path('storage/res_image')` — Railway's filesystem is ephemeral, so uploads vanish on restart. Needs object storage. **Also why every legacy profile image 404s.**

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
