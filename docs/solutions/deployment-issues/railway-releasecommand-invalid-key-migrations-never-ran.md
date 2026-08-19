---
id: SOL-007
type: solution
status: done
owner: james
links: [SOL-006, SOL-005, SOL-002, DOC-020, DOC-017, DOC-006]
updated: 2026-08-19
title: "Railway never ran a single migration, for months, while every deploy reported SUCCESS"
slug: "railway-releasecommand-invalid-key-migrations-never-ran"
category: "deployment-issues"
problem_type: "config_key_silently_ignored_no_signal_anywhere"
symptoms:
  - "Deploy status SUCCESS, application code live and serving, database schema unchanged"
  - "migrations table held 24 rows against 25 migration files (+5 Passport vendor = 30 expected)"
  - "A merged PR's code shipped while its migration did not; the schema change had to be applied by hand"
  - "Deploy logs contained ZERO occurrences of 'migrat', 'release' or 'artisan' — not an error, an absence"
  - "The runbook's own warning about this was wrong in a way that pointed away from the cause"
component: "railway.json, Railway deploy pipeline, Laravel migrations"
environment: "Railway (Hobby, DOCKERFILE builder), Laravel 8 on PHP 8.1, Supabase PostgreSQL"
tags: ["railway", "config-as-code", "migrations", "silent-failure", "deployments", "laravel", "schema-drift", "preDeployCommand"]
severity: "critical"
date_solved: "2026-08-19"
time_to_solve: "~1 hour of misdirected debugging, then minutes once the deployment EVENT LIST was read instead of the logs"
related:
  - "SOL-006 — same family: a value correct when written that became silently wrong; nothing errored at the time it broke"
  - "SOL-005 — the other 'production looked fine and wasn't'; build, tests and screenshots all green while the real output was empty"
  - "SOL-002 — Railway config quietly changing what server code sees (internal PORT=8080 vs the public origin)"
  - "SOL-004 / SOL-001 — the 'invisible to typecheck and vitest' family. Same lesson, different layer: the validating step is the one nobody runs."
  - "DOC-020 runbook — deploy traps; corrected on 2026-08-19 because its previous text described this bug incorrectly"
  - "DOC-017 RISK-009 — 'migrations table is out of sync with the real schema'; this is WHY"
  - "DOC-017 RISK-001 — the vote-destroying UNIQUE constraint applied out-of-band and never recorded"
  - "TASK-14 — add stub migrations so `artisan migrate` is trustworthy"
  - "TASK-18 — vote recovery, downstream of the constraint that got in unrecorded"
---

# Railway never ran a single migration, for months, while every deploy reported SUCCESS

`railway.json` declared a key Railway does not have. Railway ignores unknown keys without
complaint, so `php artisan migrate --force` **never executed — not once** since the platform
migration.

Nothing in the system said so. The deploy was green, the app served traffic, the healthcheck
passed, and the documentation describing this exact trap was wrong in a way that sent the
investigation in the opposite direction.

## Symptom

PR #16 merged. The deploy reported SUCCESS. The new code was live — verified behaviourally:
`getallBadges` returned 401 instead of 500, which only the new code does.

Then the check that mattered:

```sql
SELECT conname FROM pg_constraint WHERE conrelid = 'restaurant_tag'::regclass;
-- restaurant_tag_restaurant_tag_unique  UNIQUE (restaurant_id, tag_id)   ← the OLD one
```

The code had shipped. The schema had not. `migrations` still held 24 rows.

## Why the investigation went the wrong way first

The runbook said:

> **`releaseCommand` reports success even when it fails.** A green deploy does not mean
> migrations ran.

So the hunt was for a *failing command*: read the release logs, find the error, fix the error.
That search cannot terminate, because there was no error. **The command never ran.** A doc that
is wrong in a plausible direction is more expensive than no doc at all — it buys the reader a
confident wrong hypothesis.

The deploy logs were empty of `migrat`, `release` and `artisan`. That absence was read as
"logs are not exposed" rather than "the step does not exist", which cost most of the hour.

## Root cause

The answer was in the deployment's **event list**, not its logs:

```
SNAPSHOT_CODE → BUILD_IMAGE → PUBLISH_IMAGE → CREATE_CONTAINER
  → HEALTHCHECK → CONFIGURE_NETWORK → DRAIN_INSTANCES
```

**There is no release step.** And the manifest Railway actually applied contained only:

```json
{"build":{"builder":"DOCKERFILE"},
 "deploy":{"startCommand":"…","healthcheckPath":"/health","healthcheckTimeout":120}}
```

`releaseCommand` is absent — even though Railway's own `propertyFileMapping` listed
`deploy.releaseCommand`. It mapped the path and dropped the value.

Because **`deploy.releaseCommand` is not part of Railway's config schema.** It does not exist.
Railway ignores unknown keys silently. The line had been inert since the day it was written:

```json
"deploy": {
  "releaseCommand": "php artisan migrate --force && php artisan db:seed ..."
}
```

The correct key is [`deploy.preDeployCommand`](https://docs.railway.com/config-as-code/reference#pre-deploy-command),
and it takes an **array**.

### What this one typo explains

Every schema oddity in the project traces back to it:

| observation | explanation |
|---|---|
| 24 recorded migrations against 25 files (+5 Passport vendor = 30 expected) | 6 never ran |
| The vote-destroying `UNIQUE (restaurant_id, tag_id)` was never in `migrations` | applied by hand, because migrating never worked (RISK-001) |
| 8 production tables exist with no migration at all | same cause (RISK-009) |
| PR #16 shipped code but not schema | the constraint had to be applied manually via the Supabase MCP |

## The fix

```json
"deploy": {
  "preDeployCommand": [
    "sh -c \"php artisan migrate --force && php artisan db:seed --class=PassportClientSeeder --force\""
  ]
}
```

Wrapped in `sh -c` so the `&&` has guaranteed shell semantics regardless of how Railway execs
the array element.

Per Railway's docs, `preDeployCommand` runs between build and deploy, inside the private
network with the service's environment variables, and:

> "If your command fails, it will not be retried and **the deployment will not proceed**."

Which is the behaviour that was wanted all along: a failed migration now **blocks** the deploy
instead of silently shipping code against an unmigrated schema.

## Result

Verified by the `migrations` table, never by the deploy's green tick:

| | before | after fix | after the next PR |
|---|---|---|---|
| rows in `migrations` | 24 | **30** | **31** |
| latest batch | 2 | **4** | **5** |
| pending migrations | 6 | **0** | **0** |

Batch 4 was the six backlogged migrations, applied with nobody touching anything. **Batch 5 was
a migration from the following PR, applied automatically on its own deploy** — which is what
makes this a repaired pipeline rather than a lucky run.

Data intact throughout: 4,230 tag rows, highest id 5171, 1,388 restaurants, 232 users.

### Two precautions that turned out to be load-bearing

Both were written speculatively before the pipeline was fixed, and both were exercised the first
time migrations actually ran:

1. **Neutralising `2026_06_04_000001`.** It had been pending the whole time. Run as written, it
   would have re-executed `DELETE FROM restaurant_tag a USING restaurant_tag b WHERE a.id > b.id
   AND a.restaurant_id = b.restaurant_id AND a.tag_id = b.tag_id` against live votes **and**
   re-added the constraint that destroys them.
2. **Making `2026_06_04_000002` idempotent.** `tags_name_unique` already existed, so its bare
   `ADD CONSTRAINT` would have thrown — and under the new semantics a throw blocks the whole
   deploy.

Fixing the pipeline without fixing the migrations first would have either destroyed data or
bricked the deploy on its first successful run.

## Prevention

**Check the `migrations` table, not the deploy status.** The deploy status has never been
evidence on this project.

```sql
SELECT COUNT(*) FROM migrations;
```

Compare against:

```
database/migrations/*.php
  + vendor/laravel/passport/database/migrations/*.php
```

**The vendor term is not optional.** Passport publishes 5 migrations from `vendor/`
(`create_password_resets_table`, `oauth_*` ×4) that have no file in `database/migrations`. A
naive `count(files) == count(rows)` check is permanently wrong by 5 and will be ignored within a
week. Or simply assert `php artisan migrate:status` reports nothing pending.

**Read the deployment's event list, not only its logs.** Logs show what a step printed. The
event list shows *which steps existed*. This bug was invisible in logs and obvious in events —
absence of a step cannot be logged.

**Treat unknown-key tolerance as a hazard.** `railway.json` carries a `$schema`, so an editor
with schema support would have flagged `releaseCommand` immediately. Nothing validates it at
deploy time, and a config format that silently accepts nonsense will eventually be given some.

## The generalisable lesson

This survived for months because **every observable signal said "fine"** — green deploy, healthy
app, passing healthcheck — and the one document describing the trap was confidently wrong.

The only thing that could have caught it is a quantity nothing in the system compared: files on
disk versus rows in a table. 30 versus 24.

When a system has a silent failure mode, the fix is not a better alarm on the component that is
lying. It is finding an **independent quantity** that can be checked against it. Alarms are
generated by the thing you do not trust; an independent count is not.
