# Operations Runbook

> Updated 2026-06-09 · names only — never put secret values in this doc

## Deploy

All three services deploy via **Railway GitHub auto-deploy** on push to `main`
(project `c6fd4935-ffeb-4cd9-9185-81a941bcb6c7`).

| Service | Repo | Runtime | Domain |
|---------|------|---------|--------|
| API | tastemakers-backend | PHP **8.1 (pinned — Laravel 8 breaks on 8.4)** | api.tastemakersapp.com |
| Web | tastemakers-web | Node / Next.js 15, internal PORT=8080 | app.tastemakersapp.com |
| Marketing | tastemakers-marketing | Caddy static | www.tastemakersapp.com |

**Gotchas (learned the hard way):**
- `releaseCommand` in `railway.json` reports SUCCESS even when migrations fail.
  Schema changes are applied via the **Supabase SQL editor** (or Railway MCP) after
  deploy — not `php artisan migrate` in the release command (migrations table may
  be out of sync with reality).
- Inside web server code, `request.url` is `http://localhost:8080/...` — never
  build redirect origins from it; use `NEXT_PUBLIC_SITE_URL`.
- Passport RSA keys are env vars written to disk in `AuthServiceProvider::boot()`
  (survives Railway's ephemeral filesystem).

## Rollback

Railway dashboard → service → Deployments → previous successful deploy → **Redeploy**.
DB schema rollbacks are manual (Supabase SQL editor) — migrations table may be
out of sync with reality; check `SELECT * FROM migrations ORDER BY batch DESC LIMIT 10`.

## Incident triage (in order)

1. `/admin/status` — which service is red?
2. Railway → service → Logs (build vs deploy vs runtime)
3. Supabase dashboard → DB health / connection count
4. Env keys: known-missing list below — a 500 on one endpoint often = missing key
5. DNS: `dig api.tastemakersapp.com +short` (Squarespace is the NS authority)

**Known failure modes:**
- `/api/restaurants` 500 → `FOURSQUARE_API_KEY` missing
- Admin login loop, no error param → `ADMIN_EMAILS` typo (must exactly match Google email)
- Marketing 502 → Caddy container crashed or PORT mismatch
- OAuth redirect to localhost:8080 → someone used `request.url` origin (see Deploy gotchas)

## Environment inventory (names only)

| Service | Required vars |
|---------|---------------|
| API | DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD, PASSPORT_PRIVATE_KEY, PASSPORT_PUBLIC_KEY, FOURSQUARE_API_KEY ⚠️ missing, FCM_SERVER_KEY ⚠️ missing, Apple Sign-In keys ⚠️ missing |
| Web | NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS, NEXT_PUBLIC_POSTHOG_KEY, POSTHOG_PERSONAL_API_KEY, GITHUB_TOKEN (optional) |
| Marketing | none (static) |

## Local dev ports

Web 3050 · API 4050 · Admin/Swagger 4051 · Postgres 5446 · Redis 6384.
Full registry: MASTER-PORTS.md (reference docs).
