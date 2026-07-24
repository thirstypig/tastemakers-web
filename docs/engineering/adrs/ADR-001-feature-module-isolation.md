---
id: ADR-001
type: adr
status: active
phase: null
owner: james
tags: [backend, data-model]
links: [PRD-001, DOC-005, DOC-008]
updated: 2026-07-23
---

# ADR-001: Feature module isolation

**Decision status:** Accepted as the target architecture. **Implementation deferred** —
this ADR defines the boundaries; no code has been moved.

---

## Context

The backend was built by a contractor in 2021 as a single Laravel application with no
module structure. Measured July 2026:

| Signal | Measurement |
|---|---|
| Features sharing one class | **6** — `RestaurantController` (2,985 lines) holds restaurants, tags, lists, follows, photos, and cuisine search |
| Controller code in two files | **74%** — `RestaurantController` + `UserController` = 4,629 of 6,379 lines |
| Raw `DB::table()` calls in controllers | **179** |
| Raw `curl_init()` calls in controllers | **11** |
| `$_POST` superglobal reads | **3** |
| Same controller serving admin *and* API | `RestaurantController` appears **35×** in `web.php`, **32×** in `api.php` |
| Copies of the tag-ranking query | **4**, in one model file |

The consequence is not aesthetic. There is **no seam to cut along**. When a method
reads `$_POST`, queries `DB::table()`, and calls `curl_init()` in the same body, the
feature is not a component that can be moved — it is a region of a file.

Concretely, this is what it costs today:
- Changing how tag votes are counted means editing four separate queries.
- Any change to `RestaurantController` risks six unrelated features.
- The admin panel and the mobile API cannot diverge, because they are the same code.
- `PRD-001` §9 lists six defects in one feature; each requires reading a 2,985-line file
  to be sure of the blast radius.

### The counter-example that matters

**This project already does module isolation correctly** — in the code written in 2026:

```
app/Services/
  AnthropicService.php      → imports: own exception + Http, Log
  EmbeddingService.php      → imports: own exception + Http, Log
  GooglePlacesService.php   → imports: own exception + Http, Log
  TagSeederService.php      → imports: Restaurant model + DB, Log
```

Zero cross-service coupling. Each has a dedicated unit-test file. 55 tests, all green.
Compare: the entire 2021 tagging feature has **zero** tests, because there is nothing
isolated enough to test.

This is not a new practice to adopt. It is an existing practice to extend backwards.

### Why now, and why the window closes

**Corrected 2026-07-24:** the Railway/Supabase production database is **not** empty — it
holds the full 2021–2025 dataset (4,230 tag rows, 1,388 restaurants, 232 users). The
earlier claim here was stale.

The window argument still holds, for a different reason: the App Store iOS build still
calls the legacy Namecheap host, so **no shipped client currently depends on the Railway
API's response shapes.** That makes restructuring cheap right now — but the data is live,
so schema changes are no longer free. Treat the database as production from here.

The moment iOS is repointed and submitted, old app versions live in the wild for
months, and every response shape becomes a compatibility contract. **[inferred]** —
based on the migration state as of 2026-07; verify `Constant.swift` before relying on it.

---

## Decision

**Organise the backend into feature modules, one per coherent unit of user value,
using the existing `app/Services/` pattern as the template.**

### Module boundaries

Derived from the feature inventory. These are the same boundaries the docs tag
vocabulary uses, so docs and code agree on what a feature is.

| Module | Owns | Currently lives in |
|---|---|---|
| `Tagging` | tag apply/delete, vote counting, ranking, tag search | `RestaurantController`, `TagController`, `Restaurant` model |
| `Discovery` | browse, detail, cuisine, nearby, search-by-tag | `RestaurantController` |
| `Lists` | tastemaker lists, list contents, bookmarks | `RestaurantController` |
| `Social` | follows, tastemaker profiles, badges | `RestaurantController`, `UserController` |
| `Photos` | upload, like, report, delete, moderation | `RestaurantController` |
| `Accounts` | signup, login, OAuth, password reset, profile | `UserController` |
| `TagSeeding` | AI tag generation pipeline | `app/Services/` ✅ *already isolated* |

### Rules a module must follow

1. **One module owns its tables.** Another module reads them through the owner's public
   interface, never with its own `DB::table()`.
2. **No raw infrastructure in controllers.** External calls go through a service class;
   database access goes through the model or a query object.
3. **Input validation at the edge** — a Form Request per endpoint. No `$_POST`, no
   inline `$request->validate()` with empty rules.
4. **Output through an API Resource.** This is what makes extraction safe: response
   shape becomes explicit and testable instead of implicit in controller code.
5. **Admin and API do not share a controller.** They have different auth, different
   audiences, and different rates of change.
6. **A module ships with tests.** The `app/Services/` precedent: no service without a test file.

### What stays out of scope

- iOS, Android, and web client structure. This ADR is backend-only.
- The Blade admin panel's internal organisation.
- Renaming `testmaker` → `tastemaker` (228 occurrences). Worth doing, but it is a
  separate mechanical change and mixing it with extraction makes both unreviewable.

---

## Consequences

### Positive

- Blast radius per change drops from "six features" to "one."
- The tag-ranking query gets one home instead of four.
- Features become independently testable — currently the largest coverage gap.
- Admin and API can diverge, which they need to.
- The docs map 1:1 onto the code: a PRD describes a module, a module implements a PRD.

### Negative — stated honestly

- **This is weeks of work, not days**, and it delivers **zero** user-visible value.
- It touches every P1 security finding's surrounding code, so it must not run
  concurrently with security fixes — reviews become impossible to reason about.
- More files, more indirection. On a solo project that is a real cost, not a
  theoretical one.
- **The API Resource layer must land first.** Extracting endpoints without it will
  silently change response shapes, and there are no contract tests to catch that.

### Risks

| Risk | Mitigation |
|---|---|
| Response shapes drift, breaking iOS in the field | Add API Resources **first**; snapshot-test every endpoint's JSON before moving anything |
| Refactor collides with the 10 open P1 security fixes | Fix P1s first. Do not interleave. |
| Half-finished migration leaves two patterns in place | Extract one complete module at a time; each lands merged and green |
| The window closes (iOS repointed mid-refactor) | Sequence explicitly against RM-01 in the roadmap |

### Extraction order

Smallest and most self-contained first, to prove the pattern on low stakes:

1. **`Photos`** — 5 endpoints, own table, nothing else reads it. Lowest risk.
2. **`Accounts`** — well-bounded, but touches auth; do it while attention is high.
3. **`Lists`** — has a missing migration (`testmaker_list`) to resolve first.
4. **`Social`** — spans two controllers.
5. **`Discovery`** — largest read surface.
6. **`Tagging`** — **last, deliberately.** It is the core value prop and carries the
   most unresolved defects (`PRD-001` §9). Move it once the pattern is proven, not while
   it's being invented.

### Prerequisites before step 1

- [ ] Fix TASK-01 — the pending unique-constraint migration would destroy the vote model
- [ ] Fix the P1 security backlog (RM-02)
- [ ] Add API Resources + JSON snapshot tests for every endpoint
- [ ] Confirm iOS is still pointed at the legacy host (the window)

---

## Alternatives considered

**Leave it as-is.** Defensible for a codebase in maintenance. Rejected because this one
is under active development, and `PRD-001` shows the cost is already being paid — six
known defects in one feature, none of them independently testable.

**Rewrite the backend.** Rejected: throws away five years of working behaviour to solve
a structural problem, and there are no tests to verify the rewrite matches.

**Extract everything at once.** Rejected: unreviewable, and it would collide with the
P1 security work.

---

## Note on ADRs vs the decision log

ADRs are for decisions that are **expensive to reverse** — framework, database, auth
model, module boundaries. Everything smaller is a one-line entry in
`engineering/decision-log.md`: date · decision · why.

If you are unsure which one it is, it is a decision-log entry.
