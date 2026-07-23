---
id: PRD-002
type: prd
status: draft
shipped: false
phase: null
owner: james
tags: [accounts, backend, security]
links: [DOC-019, DOC-017, PRD-001, RM-10]
updated: 2026-07-23
---

# Account management & deletion

> **Forward-looking PRD.** Nothing here is built. Statements about *current* behaviour
> are verified against the code; statements about the *proposed* design are proposals
> awaiting your decisions — marked **[decide]**.

---

## 1. Problem statement

**A user who wants to leave Tastemakers has no way to do it.**

Verified against the code on 2026-07-23: there is no `DELETE /user`, no account-closure
endpoint, no anonymisation routine, and no scheduled purge anywhere in the backend. A
person who signed up in 2021 and never returned still has their email, real name,
profile photo, social handles, push-notification device tokens, and a complete record of
every restaurant they tagged, sitting in the database indefinitely.

Data is retained forever **by absence of a decision, not by one.**

**Who this affects:** every account holder, and you.

## 2. Strategic rationale

Three reasons, in descending order of urgency:

1. **Likely App Store compliance exposure.** Apple guideline 5.1.1(v) requires apps that
   offer account creation to offer in-app account deletion. Tastemakers creates accounts
   and is live (id 1573533249). **[verify]** — check Apple's current guideline text
   before your next submission; requirements change and I'm reasoning from a rule I
   believe applies, not from a review notice you've received. If it applies, this is a
   **release blocker for the iOS update that RM-01 requires**, which puts it on the
   critical path for the whole hosting migration.
2. **No way to honour an erasure request.** GDPR/UK-GDPR erasure and CCPA deletion
   rights have no technical means of being satisfied today. One request creates an
   incident.
3. **Trust.** A product built on people volunteering opinions about where they eat
   depends on them believing they can take it back.

## 3. User story

> As someone who no longer wants to use Tastemakers, I want to delete my account and my
> data from inside the app, so that I don't have to email a stranger and hope.

> As the operator, I want deletion to be a routine, reversible-for-a-window operation, so
> that a mistake or a compromised account doesn't destroy a real person's history
> irrecoverably.

## 4. Assumptions

| # | Assumption | Status |
|---|---|---|
| A1 | Deletion volume will be low enough that a soft-delete + grace period is operationally trivial | **[inferred]** — reasonable for current scale |
| A2 | Users expect deletion to remove their *identity*, not necessarily their *contributions* — the way a deleted forum account leaves "[deleted]" posts | **[decide]** — this is the core question, see §6 |
| A3 | A 30-day grace period is acceptable to app-store reviewers and to users | **[verify]** — Apple requires deletion to be *initiated* in-app; a grace window is generally acceptable but confirm |

## 5. Impact & KPIs

### (a) What the metric *should* be

| Metric | Target | Why |
|---|---|---|
| Time from request to deletion completing | ≤ 30 days | The compliance clock |
| Deletion requests requiring manual intervention | 0 | If it needs you, it will rot |
| Orphaned rows after deletion | 0 | Verified by a test, not by inspection |
| Tag-ranking drift caused by deletions | measured, not zero | See §6 — some drift is inherent; unmeasured drift is the problem |

### (b) What we can measure today

**Not instrumented, and not applicable** — the feature does not exist. No account has
ever been deleted, so there is no baseline. The first of these metrics becomes
measurable the day the feature ships.

## 6. Technical notes — and the decision that actually matters

### 🔴 The hard question: what happens to a deleted user's tag votes?

This is why account deletion is a PRD and not a to-do. Tastemakers' entire ranking
signal is `COUNT(restaurant_tag rows)` — one row per user per tag (`PRD-001`). A deleted
user's rows *are* votes other people are relying on.

| Option | Effect on the user | Effect on the product |
|---|---|---|
| **A. Hard delete rows** | Genuinely gone | Tag counts drop. A restaurant's top tag can change because someone left. Rankings silently shift. |
| **B. Null the `user_id`, keep the row** | Identity gone, contribution stays | Counts preserved — **but see the collision below** |
| **C. Reassign to a tombstone user** | Identity gone, contribution stays, dedup intact | One extra row in `users`; needs care that the tombstone can't log in |

**[decide]** — my recommendation is **C**, and here is the specific reason B is a trap:

`restaurant_tag.user_id` is **already nullable**, and null is already meaningful — it
marks **AI-seeded tags** (`source: google_seed`, migration `2026_05_14_000001`). If you
null a departed user's rows, their human votes become indistinguishable from machine
output unless `source` is set correctly at the same moment. Option C sidesteps the
collision entirely and keeps the one-vote-per-user constraint (TASK-01) meaningful.

### What deletion must touch

| Table / store | Action |
|---|---|
| `users` | Anonymise PII; keep the row as a tombstone reference **[decide]** |
| `restaurant_tag` | Per §6 decision above |
| `restaurant_user` (saves) | Hard delete — private to the user, no shared signal |
| lists (`testmaker_list`) | **[decide]** — public lists others bookmarked are a shared artifact, like tags |
| photos | Hard delete **[decide]** — but check where files physically live first (unknown, DOC-007) |
| image likes | Hard delete |
| follows | Hard delete both directions |
| `device_token`, `fcm_token` | Hard delete immediately — stop sending push on request, not in 30 days |
| badges | Hard delete |

### Proposed shape

- `POST /api/account/delete` — authenticated, uses `Auth::id()` **only**, never a body
  `user_id`. Given TASK-02 and TASK-03 both exist because of exactly that mistake, this
  endpoint is the one where getting it wrong is unrecoverable.
- Marks `deletion_requested_at`; a queued job performs the work after the grace period.
- `POST /api/account/cancel-deletion` during the window.
- Confirmation requires re-authentication.
- Deletion is **logged** (who, when, what was purged) — without user PII in the log.

### Also in scope: account management generally

The same surface should carry what's missing alongside deletion — data export (an
erasure right's twin), email change, and a visible list of connected OAuth providers.
**[decide]** whether export ships with v1 or follows.

## 7. AI implementation notes

Not applicable — no AI involved.

One interaction worth noting: if a deleted user's tags are removed (option A), any
`tags.embedding` canonical that existed only because of their tag may become orphaned.
The seeding pipeline creates canonicals independently, so this is unlikely, but it should
be checked once rather than assumed.

## 8. Testing plan

**What exists:** nothing — the feature doesn't exist.

**What must exist before this ships** (this is a destructive operation; tests are not optional):

1. Deleting an account removes every PII field from `users`
2. Deleting an account cannot be triggered for *another* user, even with a forged body `user_id`
3. Tag counts on affected restaurants change exactly as the chosen option specifies — asserted with a fixture, not by eyeball
4. Device tokens are purged immediately, not after the grace period
5. Cancelling within the window fully restores the account
6. After the window, the job is idempotent — running twice doesn't error
7. No orphaned rows remain in any pivot table
8. A deleted user's email can be reused for a new signup **[decide]**

## 9. Deferred / future enhancements

Explicitly **out of scope** for v1:

- Self-service data export (**[decide]** — may need to be in scope for GDPR parity)
- Admin-initiated deletion (moderation)
- Bulk deletion of dormant accounts
- Deletion of a user's contributions *without* deleting the account
- Any change to how tags rank — that's `PRD-003`

---

## Open questions

1. **[decide]** Tag votes: hard delete, null, or tombstone? (recommendation: tombstone)
2. **[decide]** Do public lists survive their creator, like tags do?
3. **[decide]** Does data export ship with v1?
4. **[decide]** Can a deleted email sign up again?
5. **[verify]** Apple's current wording on 5.1.1(v), and whether it gates the RM-01 submission
6. **[unknown]** Where do uploaded photos physically live? Deletion can't be designed
   without knowing what storage it has to reach into.
