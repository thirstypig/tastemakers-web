---
id: DOC-024
type: risk
status: active
phase: null
owner: james
tags: [security, backend, ios, web, infra]
links: [DOC-005, DOC-006]
updated: 2026-08-20
priority: p1
---

# Backlog review & triage — 2026-08-20

A triaged view of every open P1/P2/P3 across both backlogs, plus roadmap staleness
flags and level-of-effort. Produced from a code review of the 2026-08-20 security
batch (backend PRs #54–#58, web #64), then a full backlog pass. Findings were
verified against running code / production / the shipped iOS binary before being
trusted — the backlog has a documented habit of misstating its own impact.

**LOE scale:** `S` = <2h localized · `M` = ½–1 day · `L` = multi-day or needs an
App Store cycle · `XL` = weeks (roadmap-scale).

---

## Running tally

Starting point (2026-08-20, after this review filed 078/079/080/081/133):

- **Root backlog:** 54 open / 133 total (+15 deferred)
- **Backend backlog:** 32 open / 81 total
- **Combined open:** 86

| Date | Closed this session | Root open | Backend open | Note |
|---|---|---|---|---|
| 2026-08-20 | baseline | 54 | 32 | review filed 078/079/080/081/133 |
| 2026-08-20 | +4 | 53 | 29 | 078, 079, 080 (backend P1s) + 132 (data-loss). All with tests, revert-verified, merged. |
| 2026-08-20 | **9 total** | 48 | 29 | + 054 (P1 transactions + bookmark TOCTOU constraint, verified live on prod), 095 (env resolver), 106 (privacy wording), 003 + 004 (both mis-prioritised P1s — closed as not-a-bug / doc). |

**Verified-not-a-bug closes (were mis-prioritised P1s):** `003` — iOS CodingKey + web
read `short_description` correctly, no data loss. `004` — `search-tags` and
`pre-define-search-tags` are two complementary endpoints, not a divergence; documented.

**Closed this session (all shipped via PR, tests revert-verified):**
- `078` OTP-page reflected XSS — route constrained to `[0-9]{8}`, dead sink removed (backend PR #60)
- `079` unauthenticated `/api/signup` arbitrary-file upload — mimes rule added (backend PR #60)
- `080` `pre-define-search-tags` 500-on-every-call — GROUP BY / ORDER BY / empty-bind fixed (backend PR #62)
- `132` `TastemakerList-edit` empty-`restaurant_id` data loss — filter + transaction (backend PR #63)

**Re-triaged, NOT shipped:** `081` (reset-verify DoS) is **blocked on 123** — the obvious "key on `forget_code`" fix trades the DoS for a brute-force hole; both need a trustworthy client IP (todo 123).

---

## Roadmap (DOC-005) — staleness flags

The macro roadmap is structurally sound. Three stale claims:

- **RM-02** cites "an endpoint that lets any user delete any list (TODO-068)" as its
  headline P1 — but **068 is closed** (`imagelikeunlike-idor`). Re-count: 9 root + 8
  backend P1 open, and this review *added* 3 backend P1s (078/079/080).
- **RM-13** claims "zero MySQL-only constructs remain." False — `categoryTagApi` still
  ships MySQL-permissive `GROUP BY` that 500s on Postgres (backend 080). The sweep
  missed a live site.
- **RM-01 / RM-04 / RM-16** are accurate and remain the real anchors.

---

## The real shape of the backlog

86 open oversells the work:

| Bucket | ~count | Meaning |
|---|---|---|
| Genuinely workable now | ~40 | Backend/web, no external blocker |
| Blocked on an App Store cycle | ~15 | Every `ios-*` finding — frozen behind 1.2.1 (2023-12-04) |
| Blocked on James | ~6 | Credential rotation, GCP console, paid-API & product decisions |
| Projects wearing a ticket's clothes | ~8 | "complete supabase auth", "user access tiers", brand-name×228 |
| Dedup: one problem filed 4–5× | — | Response envelope: root 006/032/064/028 + backend 026 |

---

## P1 — Critical

### Verified today — highest confidence

| ID (backend) | Detail | LOE |
|---|---|---|
| `078-otp-page-reflected-xss` | Live reflected XSS on `/forgetpassword/otp/{code}`, same origin as `/admin`. Reproduced on production. | S |
| `079-unauth-signup-unrestricted-upload` | Anonymous `/api/signup` plants HTML/JS on the api origin. The half of PR #57's fix that was missed. | S |
| `080-pre-define-search-tags-500s` | Endpoint 500s on every call (Postgres GROUP BY/ORDER BY). Confirmed against prod. | M |

### Real, workable, verify-first

| ID | Backlog | Detail | LOE |
|---|---|---|---|
| `006-idor-user-id-from-request` | backend | user_id from request body instead of auth → act-as-anyone. | S–M |
| `054-no-db-transactions` | root | Multi-write ops not wrapped → partial writes on failure. | M |
| `089-web-bypasses-laravel-api` | root | Web reads Supabase directly — 4th source of truth. | L |
| `123-throttle-keys-on-proxy-ips` | root | Login limiter keys on Railway's rotating IPs → unthrottled. | M (decision-gated) |

### Blocked or superseded — do not schedule as-is

| ID | Detail | Status |
|---|---|---|
| `073-foursquare-credentials` | `/api/restaurants` dead for everyone. | Blocked on James; superseded by 076 |
| `076-google-places-migration` | Foursquare replacement. | Blocked — step 2 blanks the iOS feed (root 100). L |
| `075-tastemaker-follow` | Writes to a non-existent table — dead feature. | Product decision |
| `024-ios-hardcoded-api-keys` | Places key compiled into the binary. | Blocked on James (GCP key restriction) |
| `005 / 046 credentials in git` | Live creds in history. | Blocked on James — rotate (S), then scrub |
| `100 / 101 iOS silent failures` | Blank feed / stuck spinner on any shape change. | S-fix / L-to-land (App Store) |
| `003 / 004 api-contract` | Field/endpoint name divergences. Low impact; 004 superseded by 080. | S each |

---

## P2 — Important (grouped)

| Cluster | IDs | Detail | LOE |
|---|---|---|---|
| Response envelope (filed 5×) | root 006/032/064/028 + backend 026 | Inconsistent `{status,msg}` vs `{message,errors}`. One design + rollout. | M–L once |
| iOS installed-base (App Store) | root 070/071/095/102/103/104/130/133 | Double-completion, token in UserDefaults, id-type corruption, 422-as-success. | S-fix each / L-to-land |
| Tag-seeding pipeline (RM-04) | backend 033/034/035/041/042/044 | Job + CLI + endpoints that don't exist yet. Load-bearing per EXP-001. | L–XL |
| Backend security/quality | backend 015/016/017/019 + root 066/067/069 | lat/lng strings, mass-assignment, GET-delete CSRF, no FormRequests, Passport TTL, OTP expiry. | S–M mix |
| New this review | backend 081 (reset DoS), root 132 (list-wipe 500) | Both verified. | S each |
| Not really tickets | root 086/087/088/011 | Auth completion, access tiers, admin buildout, brand-name×228. | XL / ongoing |
| The shim | root 114/115 | No removal criterion; double-hop cross-region. | M |
| Tag correctness | root 121, 130 | 121 = dead code (S delete). 130 = iOS/web divergence (L). | |

---

## P3 — Nice-to-have (cleanup, nothing blocks)

| Theme | IDs | LOE |
|---|---|---|
| Backend perf | backend 031/063 + root 047/048/049 | S–M each |
| Dead code / dupes | backend 023/028/030/064 + root 043/044/045/076 | S each |
| WordPress hygiene | root 018/042 | S (or delete the repo) |
| API surface / docs | root 016/040/041/081 + backend 026 | M |
| iOS cleanup | root 075/083/128 | S-fix / L-to-land |
| Marketing | root 106 | S |

---

## Recommended sequence

1. **No blockers, this week:** `078` + `079` (both S, unauthenticated web-facing P1s),
   then `080` (M, dead endpoint).
2. **Decision-gated, high value:** commit to Google Places (076/077) *with* the iOS-feed
   guard (100), or it silently breaks the installed base.
3. **Cheap wins that clear noise:** `081`, `132`, `121` (delete dead code), the
   response-envelope cluster as *one* task.
4. **Blocked-on-James, 5 min each:** rotate leaked creds (005/046), restrict the GCP key (024).
5. **Defer honestly:** every `ios-*` is one batched App Store release.
