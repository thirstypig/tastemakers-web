---
id: DOC-010
type: testing
status: draft
phase: null
owner: james
tags: [backend, web]
links: [ADR-001, PRD-001]
updated: 2026-07-23
---

# Testing strategy

## Where coverage actually is today

Stated plainly, because the shape of it is the strategy problem:

| Area | Tests | State |
|---|---|---|
| Web (`tastemakers-web`) | **127** across 13 files | ✅ all green |
| Backend AI services (2026) | **55** across 4 files | ✅ all green |
| Backend feature tests | **9** across 3 files | ⚠️ **1 passing, 8 failing** |
| **Backend 2021 features** | **0** | ❌ tagging, lists, photos, social, discovery — nothing |
| iOS | 0 | ❌ |
| Android | n/a | no app exists |

**The inversion is the headline.** The code written in 2026 — services that have never
run in production — has 55 tests. The code that has been live on the App Store since
2021, serving every real user, has none.

### The 8 failing backend tests

Not flaky. They encode two real defects:

- **`AuthTest` (4 failing)** — tests assert HTTP 400 on bad credentials; the API returns
  **HTTP 200 with `{"status": false}`**. The tests are right and the controller is
  wrong. Fixing the controller is an API change and needs client coordination.
- **`UserProfileTest` (3 failing)** — `GET /api/user` returns 500, Postgres
  "in failed sql transaction" cascading from a failed subquery. Root cause not identified.

Leaving them red is a deliberate choice: they document real bugs. **They must not be
skipped or deleted to make the suite green.**

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
