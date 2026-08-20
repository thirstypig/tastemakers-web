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

_Generated 2026-08-20 by `npm run docs:refresh` — do not edit between these markers._

**Now:** RM-01 Finish the hosting migration · RM-02 Fix the P1 security backlog · RM-13 PostgreSQL compatibility sweep

**Next 3 to-dos:**

1. **TASK-24** (p2) — Retire the `/v2/api` iOS shim (`tastemakers-web/next.config.ts`). **Blocked on two things:** the iOS build that moves `NetworkManager.swift:14` off the legacy prefix must ship AND drain, and shim usage must be instrumented — the stated gate ("iOS adoption > 90%") currently has no instrument behind it, since PostHog is browser-only and never sees a `URLSession` call. Removal condition: `/v2/api/*` under 10 requests/day for 30 consecutive days.
2. **TASK-20** (p1) — Photo upload is off. `restaurant-image-save` writes to `public_path('storage/res_image')` — Railway's filesystem is ephemeral, so uploads vanish on restart. Needs object storage. **Also why every legacy profile image 404s.** **CORRECTED 2026-08-19:** the ephemeral disk is real but SECONDARY — the endpoint 500s on its first statement, because `logAdd` wrote four column names `api_logs` does not have. Fixed in backend PR #38, so uploads now reach the filesystem and *then* hit this. Validation was also absent (`"image" => ""`); now mimes + size limited. What remains here is genuinely the storage.
3. **TASK-21** (p1) — Foursquare credentials unset, so `/api/restaurants` returns `status:false` for every caller — including the iOS app just reconnected by the /v2/api shim. Legacy V3 deprecated 2026-05-15 and V2 Pro is now priced, so this is a vendor/cost decision. Backend todo 073. **CONFIRMED 2026-08-19:** 12 live `api.foursquare.com` call sites remain in RestaurantController, keys still unset.

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
