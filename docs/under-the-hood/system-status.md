---
id: DOC-015
type: status
status: active
phase: null
owner: james
tags: []
links: [DOC-001]
updated: 2026-08-18
---

# System status

> **GENERATED (lite) — do not hand-edit.** `npm run docs:refresh`.

> **What this does and does not tell you.** It reports whether each service's env key
> is *present in the environment where this script ran* — nothing more. It does not
> call any service, and it **never prints a key's value.** Running locally will show
> production-only keys as not set; that is expected and is not an outage.

## Configuration

| Service | Env key | Service | Configured here |
|---|---|---|---|
| Supabase (database) | `DB_PASSWORD` | backend | ⬜ not set here |
| Supabase (web client) | `NEXT_PUBLIC_SUPABASE_URL` | web | ⬜ not set here |
| Supabase (web server) | `SUPABASE_URL` | web | ⬜ not set here |
| Admin allowlist | `ADMIN_EMAILS` | web | ⬜ not set here |
| Foursquare | `FOURSQUARE_API_KEY` | backend | ⬜ not set here |
| Google OAuth | `GOOGLE_CLIENT_ID` | backend | ⬜ not set here |
| Google Places | `GOOGLE_PLACES_API_KEY` | backend | ⬜ not set here |
| Anthropic (Claude Haiku) | `ANTHROPIC_API_KEY` | backend | ⬜ not set here |
| Voyage AI (embeddings) | `VOYAGE_API_KEY` | backend | ⬜ not set here |
| Firebase FCM (push) | `FCM_SERVER_KEY` | backend | ⬜ not set here |
| Passport signing key | `PASSPORT_PRIVATE_KEY` | backend | ⬜ not set here |
| PostHog | `NEXT_PUBLIC_POSTHOG_KEY` | web | ⬜ not set here |
| GitHub token | `GITHUB_TOKEN` | web | ⬜ not set here |

## Deployment

Platform: **Railway**, project `c6fd4935-ffeb-4cd9-9185-81a941bcb6c7`, GitHub auto-deploy.

<!-- Last deploy time is not read here: it needs a Railway API token, which this script
     deliberately does not require. Check the Railway dashboard, or wire it in later. -->

## Known configuration gaps

- `FOURSQUARE_API_KEY` unset on Railway → `GET /api/restaurants` fails
- `GITHUB_TOKEN` (web service) expires ~2027-06 → admin docs silently stop loading

---

<!-- FUTURE: real health checks.
     Dormant until there are paying users — polling costs money and attention, and
     nobody is woken up by these today. When it earns its place, each service gets:

       | Service | Endpoint | Latency | Uptime 30d | Last checked |
       |---------|----------|---------|------------|--------------|
       | API     | GET /api/health        | 120ms | 99.9% | 2026-07-23T10:00Z |
       | Web     | GET /                  |  80ms | 99.9% | 2026-07-23T10:00Z |
       | DB      | SELECT 1               |  15ms | 100%  | 2026-07-23T10:00Z |

     Implementation sketch:
       - add a cheap GET /api/health to the Laravel API (no auth, no DB write)
       - probe each service here with a 5s timeout, record latency
       - persist results so uptime is a rolling window, not a single sample
       - src/lib/api-probe.ts already has runCheck() with tests - reuse it
-->

<!-- generated 2026-08-18T16:24:33.091Z by scripts/refresh-docs.mjs -->
