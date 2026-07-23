---
id: DOC-008
type: api-docs
status: draft
phase: null
owner: james
tags: [backend, security]
links: [ADR-001, DOC-007, PRD-001]
updated: 2026-07-23
---

# API docs

**Base URL:** `https://api.tastemakersapp.com/api` (prod) · `http://localhost:4050/api` (dev)
**Auth:** Bearer token from `POST /login`, issued by Laravel Passport.

> **Populate inputs and outputs from the actual code.** The route list, HTTP method, and
> auth column below are extracted from `routes/api.php` and are accurate as of
> 2026-07-23. Request and response shapes are marked `TODO` where the controller method
> hasn't been read yet — **do not guess them.** There are no API Resource classes, so
> the only source of truth for a response shape is the controller body.

Grouped by the module boundaries in `ADR-001`, not by file.

---

## Template — copy this row shape

| Method | Path | Auth | Inputs | Outputs | Notes |
|---|---|---|---|---|---|
| `POST` | `/example` | 🔒 | `field` (required, type) | `{status, msg, data}` | Anything surprising |

**Auth key:** 🔒 = behind `auth:api` · 🌐 = public, no token required

---

## Accounts

| Method | Path | Auth | Inputs | Outputs | Notes |
|---|---|---|---|---|---|
| `POST` | `/login` | 🌐 | TODO | TODO | Throttled 5/min. Returns **HTTP 200 with `{"status": false}`** on bad credentials — not a 4xx. Non-standard; 4 tests assert against it. |
| `POST` | `/signup` | 🌐 | TODO | TODO | Throttled 5/min |
| `POST` | `/google-login` | 🌐 | TODO | TODO | Stores the raw OAuth token as an unhashed password (TODO-009) |
| `POST` | `/apple-login` | 🌐 | TODO | TODO | ⚠️ JWT signature is never verified (TODO-003) |
| `POST` | `/forget-password` | 🌐 | TODO | TODO | Throttled 5/min. OTP never expires (TODO-020) |
| `POST` | `/forget-password-verify` | 🌐 | TODO | TODO | Throttled 5/min |
| `POST` | `/username-existOrnot` | 🌐 | TODO | TODO | |
| `GET` | `/user` | 🔒 | — | TODO | Currently 500s in tests — Postgres "in failed sql transaction" |
| `POST` | `/update-profile` | 🔒 | TODO | TODO | |
| `POST` | `/change-password` | 🔒 | TODO | TODO | |
| `GET` | `/logout` | 🔒 | — | TODO | GET performing a state change |
| `POST` | `/device-details` | 🔒 | TODO | TODO | FCM device registration |
| `POST` | `/notification` | 🔒 | TODO | TODO | |

## Tagging

| Method | Path | Auth | Inputs | Outputs | Notes |
|---|---|---|---|---|---|
| `POST` | `/restaurant-tag` | 🔒 | `place_id` (req), `tags` (req, **comma-separated string**), `categories` (comma-separated) | `{status: true, msg}` | Creates the restaurant if `place_id` is unseen. Uses `Auth::user()->id` correctly. |
| `POST` | `/tags-delete` | 🔒 | `tags_id` (req, comma-separated), `place_id` (req), **`user_id` (req)** | TODO | 🔴 Takes `user_id` **from the request body** — any user can delete another user's vote. See TASK-03. |
| `GET` | `/tags` | 🔒 | TODO | TODO | |
| `GET` | `/user-tags` | 🔒 | TODO | TODO | |
| `POST` | `/search-tags` | 🔒 | TODO | TODO | |
| `POST` | `/pre-define-search-tags` | 🔒 | TODO | TODO | Handled by `CategoryController` |
| `POST` | `/searchBy-Tags` | 🔒 | TODO | TODO | |

## Discovery

| Method | Path | Auth | Inputs | Outputs | Notes |
|---|---|---|---|---|---|
| `GET` | `/restaurants` | 🌐 | TODO | TODO | ⚠️ Fails — `FOURSQUARE_API_KEY` unset on Railway. **Was inside the auth group; deliberately moved out.** |
| `GET` | `/restaurants1` | 🌐 | TODO | TODO | **[unknown]** — purpose vs `/restaurants`. Replacement? Experiment? Abandoned? |
| `GET` | `/restaurant-detail` | 🌐 | TODO | TODO | **Moved out of the auth group** |
| `GET` | `/nearByCuisine` | 🌐 | TODO | TODO | |
| `POST` | `/nearbycuisine` | 🌐 | TODO | TODO | Near-duplicate of the line above, differing only in case |
| `POST` | `/recent-review-restaurant` | 🌐 | TODO | TODO | |
| `POST` | `/restaurant-save` | 🔒 | TODO | TODO | Save to profile |

## Lists

| Method | Path | Auth | Inputs | Outputs | Notes |
|---|---|---|---|---|---|
| `POST` | `/ListTitleSave` | 🔒 | TODO | TODO | Writes to `testmaker_list` — a table with **no migration** |
| `POST` | `/ListWithRestaurantids-save` | 🔒 | TODO | TODO | |
| `POST` | `/TastemakerList-edit` | 🔒 | TODO | TODO | |
| `POST` | `/tastemakerlist-delete` | 🔒 | TODO | TODO | 🔴 **No ownership check of any kind** — any authenticated user can delete any list by guessing an id. TASK-02. |
| `POST` | `/bookmark-TastemakerList` | 🔒 | TODO | TODO | |
| `GET` | `/gettastemaker-List` | 🌐 | TODO | TODO | **Moved out of the auth group** |
| `POST` | `/resaturantsbylistid` | 🌐 | TODO | TODO | Typo in the path is real — `resaturants`. **Moved out of the auth group.** |
| `POST` | `/getTastemaker-CreatedList` | 🌐 | TODO | TODO | **Moved out of the auth group** |

## Social

| Method | Path | Auth | Inputs | Outputs | Notes |
|---|---|---|---|---|---|
| `POST` | `/tastemaker-follow` | 🔒 | TODO | TODO | |
| `GET` | `/review_count` | 🔒 | — | TODO | |
| `POST` | `/getallBadges` | 🌐 | TODO | TODO | 🔴 **Hardcodes `user_id = 43`** in 3 places — calls `Auth::user()` and never uses it, so every caller sees user 43's badges (TASK-09). Also uses MySQL-only `IFNULL` → **throws on PostgreSQL** (TASK-10). Reads `badge_categories`, a table with no migration. |

## Photos

| Method | Path | Auth | Inputs | Outputs | Notes |
|---|---|---|---|---|---|
| `POST` | `/restaurant-image-save` | 🔒 | TODO | TODO | |
| `POST` | `/image-likeunlike` | 🔒 | TODO | TODO | |
| `POST` | `/image-delete` | 🔒 | TODO | TODO | |
| `POST` | `/report-image` | 🔒 | TODO | TODO | |
| `POST` | `/restaurant-image-list` | 🌐 | TODO | TODO | **Moved out of the auth group** |

---

## Cross-cutting notes

**43 endpoints: 25 authenticated, 18 public.**

**Six endpoints were deliberately de-authenticated — and that was intentional.**
In `routes/api.php` lines 47–62 they are commented out *inside* the `auth:api` group,
then re-declared outside it at lines 72–79.

**[intended] — confirmed by James, 2026-07-23:** signed-out users are meant to browse.
An account is what unlocks *writing* — submitting tags, creating tags, applying existing
ones. So the public/authenticated split above is correct by design, and these endpoints
should **not** be moved back behind auth.

The rule that follows: **reads may be public; writes are always authenticated.** Any
endpoint that violates it is a bug, not a design choice — which is precisely what makes
`/tags-delete` and `/tastemakerlist-delete` below defects rather than decisions.

**No API Resource classes exist.** Response shapes are constructed inline in controller
bodies and are inconsistent between endpoints. This is why `ADR-001` requires an API
Resource layer *before* any module extraction — without it, moving an endpoint can
silently change its output.

**Naming is inconsistent** across the surface: `ListTitleSave` (PascalCase),
`restaurant-tag` (kebab), `getallBadges` (mixed), `resaturantsbylistid` (typo,
lowercase). Not worth fixing — it would break every client — but worth knowing before
you guess a path.

**`POST` is used for reads** in several places (`getTastemaker-CreatedList`,
`recent-review-restaurant`, `restaurant-image-list`). Do not infer intent from the verb.
