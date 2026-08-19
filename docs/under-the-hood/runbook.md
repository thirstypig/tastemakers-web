---
id: DOC-020
type: runbook
status: active
phase: null
owner: james
tags: [infra, backend, web]
links: [DOC-007, DOC-017]
updated: 2026-07-23
---

# Runbook

**How to operate this thing.** Written for the version of you that is tired, or the
person who inherits it. Assume no memory of context.

---

## Deploy

All services are on **Railway**, project `c6fd4935-ffeb-4cd9-9185-81a941bcb6c7`, with
GitHub auto-deploy. **Push to the default branch = deploy.** There is no separate
deploy command.

| Service | Repo | Branch | Domain |
|---|---|---|---|
| Laravel API | `tastemakers-backend` | `main` | `api.tastemakersapp.com` |
| Web app | `tastemakers-web` | `main` | `www.tastemakersapp.com` |
| Marketing | `tastemakers-marketing` | `main` | **retired 2026-08-18** — `www` now serves `tastemakers-web` |

### Before you push
1. `npm run docs:refresh` (web) — keeps the board honest
2. `npm test` (web) or PHPUnit with **PHP 8.1** (backend)
3. Confirm you're on a feature branch, not `main`

### ⚠️ Deploy traps

- **Migrations do not run automatically — verify the `migrations` table, never the deploy
  status.** Corrected 2026-08-19: the old note here said `releaseCommand` "reports success
  even when it fails". It is worse than that. `deploy.releaseCommand` is **not a key
  Railway has**; Railway ignores unknown keys, so it never ran at all. Deployment
  `6b9b589b` (SUCCESS) has no release step in its event list and no `migrat`/`artisan`
  output in its logs. Production ran 24 recorded migrations against 30 files.
  The correct key is `deploy.preDeployCommand`, an ARRAY — fixed in backend PR #17.
  Full write-up, including how to verify it stayed fixed: **SOL-007**.
  **Until a migration file is confirmed appearing as a row in the production `migrations`
  table on its own, keep verifying schema changes by querying the database.**
- **PHP is pinned to 8.1.** Laravel 8 crashes on 8.4+. Locally always use
  `/opt/homebrew/opt/php@8.1/bin/php` for `artisan` and `phpunit`.
- **Never use `request.url` for redirects in Next.js server code.** Railway runs it on
  internal `PORT=8080`, so the origin is `http://localhost:8080`. Use
  `NEXT_PUBLIC_SITE_URL`.
- **The backend's local `main` tracks `gitlab/main`**, an account nobody controls, so
  `git status` reports a false "ahead 57". Fix once: `git branch -u origin/main`.

---

## Schema changes

**Do not rely on `php artisan migrate` in the release command.**

1. Check the migrations table reflects reality first — there is a 2.5-year gap and at
   least two tables exist with no migration:
   ```sql
   SELECT * FROM migrations ORDER BY batch DESC LIMIT 10;
   ```
2. Apply the change via the **Supabase SQL editor**.
3. Record it as a migration file so the repo stays truthful.

The old `/run-schema-fix` HTTP endpoint **has been removed**. Any doc referencing it is
stale.

---

## Rotating keys

**Never print or paste a key value into a doc, a commit, or a chat.**

| Key | Where it lives | How to rotate |
|---|---|---|
| `PASSPORT_PRIVATE_KEY` / `PASSPORT_PUBLIC_KEY` | Railway env (backend) | Regenerate with `passport:keys`, set both env vars, redeploy. **Invalidates every existing user token — everyone is logged out.** |
| `GITHUB_TOKEN` | Railway env (web) + local `.env.local` | Fine-grained PAT, read-only Contents on backend/ios/android. **Expires ~2027-06.** Update *both* places. |
| Supabase DB password | Railway env (all services) | Rotate in Supabase, then update every service that connects |
| `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY` | Railway env (backend) | Rotate at the provider, update Railway |
| `FCM_SERVER_KEY` | Railway env (backend) | Firebase console |
| Supabase MCP token | `~/.claude/settings.json` | Local dev only — not a production dependency |

**After any rotation:** redeploy the affected service. Railway env changes do not apply
to a running container.

---

## When something breaks

### `GET /api/restaurants` returns an error
Most likely `FOURSQUARE_API_KEY` is unset on Railway — a **known, current** gap.
Check the env var before debugging code.

### Admin docs show "could not load"
`GITHUB_TOKEN` expired or was revoked. **This fails silently** — no error surfaces in
the UI. Regenerate the PAT and update Railway *and* `.env.local`.

### Admin login loops back to `/admin/login`
`ADMIN_EMAILS` doesn't exactly match the Google account email. The session is created,
middleware rejects it, and you get a clean redirect with no `?error`. **Copy-paste the
address from the actual email — never retype it.**

### Everyone is logged out of the mobile app
Passport keys changed or weren't written to disk. They're restored from env vars in
`AuthServiceProvider::boot()` — confirm both vars are still set on Railway.

### The API is slow or unresponsive
Check Foursquare first. The call uses `CURLOPT_TIMEOUT => 0` — no timeout — inside the
request thread, so one slow upstream response holds a worker indefinitely (RISK-010).

### A deploy "succeeded" but nothing changed
Almost certainly the schema. Query the database directly:

```sql
SELECT COUNT(*) FROM migrations;   -- compare against the number of files in database/migrations
```

A green deploy has never guaranteed a migrated schema on this project (see the deploy trap
above). Check the end state, not the status.

### Custom domain stops resolving
DNS authority is **Squarespace** (nameservers), registrar is **Namecheap** (domain
only). Records set in the wrong place have no effect. Verify with
`dig <domain> NS +short`.

---

## Local development

```bash
# Web — port 3050
cd tastemakers-web && npm run dev

# Backend — port 4050, MUST be PHP 8.1
cd tastemakers-backend
/opt/homebrew/opt/php@8.1/bin/php artisan serve --port=4050

# Backend tests — needs postgres on 5432 (not 5446)
/opt/homebrew/opt/php@8.1/bin/php vendor/phpunit/phpunit/phpunit --testsuite Feature
```

Ports are fixed across every project on this machine. Check `MASTER-PORTS.md` before
assigning anything new.

---

## 🔴 Gaps in this runbook

Named so they aren't mistaken for "handled":

- **No backup or restore procedure.** If Supabase were lost tomorrow, there is no
  documented recovery path. This is the largest operational gap.
- **No rollback procedure.** Railway can redeploy a previous build, but the steps —
  and what to do about a schema change that shipped with it — are unwritten.
- **No alerting.** Nothing pages anyone. Failures are found by looking.
- **No incident log.** Nothing records what broke before, or how it was fixed.

<!-- TODO(james): the four gaps above are worth more than anything else in this file.
     Backup/restore first - it is the only one that is unrecoverable if it goes wrong. -->
