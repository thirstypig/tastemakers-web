---
id: DOC-010
type: testing
status: draft
phase: null
owner: james
tags: [backend, web]
links: [ADR-001, PRD-001]
updated: 2026-07-24
---

# Testing strategy

## Where coverage actually is today

Stated plainly, because the shape of it is the strategy problem:

| Area | Tests | State |
|---|---|---|
| Web (`tastemakers-web`) | **392** across 32 files | ✅ all green |
| Backend AI services (2026) | **54** across 5 files | ✅ all green |
| Backend — 2021 features, added 2026-08-19 | **36** across 10 files | ✅ all green |
| Backend `AuthTest` | 5 | ⚠️ **3 failing — deliberately** |
| Backend `UserProfileTest` | 5 | ✅ now green |
| iOS | 0 | ❌ |
| Android | n/a | no app exists |

**Backend total: 106 tests, 3 failing.**

**The inversion has closed.** This table used to read "Backend 2021 features: 0 — tagging,
lists, photos, social, discovery: nothing", against 55 tests for 2026 services that had
never run in production. As of 2026-08-19 the load-bearing 2021 paths have coverage,
written alongside the fixes for the bugs they were hiding:

| File | Tests | Pins |
|---|---|---|
| `AppleSignInTest` | 8 | Forged identity tokens are refused. The old code checked no signature, so any JWT naming a victim's email returned a working access token. SOL-adjacent: see todo 051. |
| `AuthorizationTest` | 5 | `auth:api` proves you are *a* user, not that the row is yours. List deletion, tag deletion, and the public profile read. |
| `GetAllBadgesTest` | 4 | The endpoint 500'd (MySQL `IFNULL`) AND served one hardcoded user's data (`user_id = 43`) AND was public. The 500 hid the other two. |
| `LegacyTableMigrationTest` | 6 | Tables that exist in production but had no migration. |
| `TagVotingTest` | 3 | A row is one person's VOTE. `UNIQUE (restaurant_id, tag_id)` deleted ~941 of them and 500'd the second voter. |
| `HaversineDistanceTest` | 3 | `radians(varchar)` and `HAVING` on a SELECT alias — both MySQL-only, both 500 on Postgres. |
| `TagLevelSqlTest` | 3 | The tag-level thresholds, after nested MySQL `IF()` became `CASE WHEN`. |
| `ApiRouteSurfaceTest` | 3 | Every path+verb App Store build 1.2.1 calls. It cannot be patched; removing one breaks installed apps for months. |
| `HttpsSchemeTest` | 2 | Railway terminates TLS at its edge, so Laravel generated `http://` URLs that iOS ATS blocks outright. |
| `PassportTestSetupTest` | 3 | The test-DB Passport fixture. |

### The 3 failing backend tests

Not flaky. They encode one real defect:

- **`AuthTest` (3 failing)** — the tests assert HTTP 400 on bad credentials; the API returns
  **HTTP 200 with `{"status": false}`**. The tests are right and the controller is wrong.
  Fixing the controller is an API change that needs client coordination, and the shipped
  iOS build cannot be patched, so it is not a unilateral change.

Leaving them red is deliberate: they document a real bug. **They must not be skipped or
deleted to make the suite green.** Compare any new failure against this baseline — 106
tests, 3 failing — rather than against zero.

The `UserProfileTest` failures listed here previously are **fixed** (the legacy-table
migrations landed).

---

## What we test, and how

| Layer | Tool | What belongs here |
|---|---|---|
| **Pure functions** | Vitest (web) / PHPUnit Unit (backend) | Ranking, filtering, validation, formatting, similarity. Fast, no I/O. |
| **Services** | PHPUnit Unit with HTTP faked | External API clients — request shape, retry, error mapping. Never hit the real API. |
| **Feature/API** | PHPUnit Feature | Endpoint contract: status, auth, response shape. |
| **Component logic** | Vitest | Extracted to `src/lib/` first — `vitest.config` uses `environment: "node"`, so there's no DOM. |
| **E2E** | Playwright (marketing only) | Currently landing-page only. |

### Rules

1. **Client-component logic gets extracted to `src/lib/` before being tested.** Established
   with `admin-filters.ts`. The component imports the pure function.
2. **No test hits a real external API.** Fake the HTTP client.
3. **Run backend tests with PHP 8.1** — `/opt/homebrew/opt/php@8.1/bin/php`. System PHP crashes Laravel 8.
4. **A failing test that documents a real bug stays failing** and gets a comment saying so.
5. **`ADR-001` precondition:** no module gets extracted without JSON snapshot tests of
   its endpoints first. Without API Resources, response shape is implicit — snapshots
   are the only safety net.
6. **Verify a new guard by breaking the thing it guards.** A test that has never failed
   is not known to work. When adding a test for a specific regression, reintroduce that
   regression once, watch the test fail, then restore. This caught a real gap in the
   SOL-004 boundary guard and confirmed the cost-math and marker-idempotency tests.
7. **The pre-push gate is `type-check` → `test` → `build`, in that order.** Two failures
   in this repo were invisible to the first two and caught only by the build (SOL-001,
   SOL-004). "Tests pass" is not "it builds."

---

## The ugly cases

The list of things that break in the real world and are easy to forget. **Fill this in
as you find them** — every entry should come from something that actually went wrong.

### Tagging (the core loop)
- [ ] Two different users apply the same tag → the count increments to 2
      *(the test that would have caught TASK-01)*
- [ ] The same user applies the same tag twice → the count stays at 1
- [ ] Concurrent requests from the same user → still one vote (SELECT-then-INSERT races)
- [ ] Tag name with different case/whitespace → resolves to one tag, not three
- [ ] A user deletes a tag vote that isn't theirs → rejected
- [ ] Seeded (`source: google_seed`) vs human votes → distinguishable in output
- [ ] Empty string in the comma-separated tag list → skipped, not stored as a blank tag
- [ ] A restaurant with zero tags → renders, doesn't crash

### Auth
- [ ] Expired Passport token → 401, not 500
- [ ] Apple Sign-In with a forged JWT → rejected *(currently would pass — TODO-003)*
- [ ] Password-reset OTP reused after use → rejected
- [ ] Password-reset OTP after 24h → rejected *(currently never expires)*

### Postgres-specific (the MySQL migration legacy)
- [ ] `LIKE` search for "italian" matches "Italian" — Postgres `LIKE` is case-sensitive,
      MySQL's wasn't. Search quality silently degraded on migration (TODO-069).
- [ ] Queries using `GROUP BY` behave under Postgres' stricter rules
- [ ] A failed subquery doesn't poison the surrounding transaction

### Infrastructure
- [ ] Foursquare slow or down → request doesn't hang forever *(`CURLOPT_TIMEOUT => 0` today — TODO-070)*
- [ ] Foursquare returns an error → no fatal on `$response->meta->code`
- [ ] Railway restart → Passport keys still present
- [ ] Missing env key → clear failure, not a silent wrong answer

<!-- TODO(james): add the ones you've actually hit. The value of this list is that it's
     specific to this product's failure modes, not a generic checklist. -->

---

## What is deliberately not tested

Being explicit so the gaps are choices, not accidents:

- **The Blade admin panel.** Internal, low traffic, changes rarely.
- **iOS.** No harness exists; adding one is a project, not a task.
- **Generated docs.** Their correctness is the generator's job — test the generator.
