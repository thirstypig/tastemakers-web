---
id: DOC-019
type: privacy
status: draft
phase: null
owner: james
tags: [security, accounts, data-model]
links: [DOC-017, DOC-007]
updated: 2026-07-23
---

# Privacy & data handling

> ## ⚠️ This document is important — treat it as such
>
> Tastemakers stores **personal data about identifiable people**: email addresses,
> real names, photographs, social media handles, push-notification device tokens, and a
> per-user record of every restaurant they tagged or saved.
>
> That last one deserves naming plainly. `restaurant_tag` records *which user applied
> which descriptive tag to which restaurant*. That is a behavioural profile — where
> someone eats, how often, and what they think about it. It supports inferences about
> location, routine, income, and social life that no individual field does.
>
> The app is **live on the App Store** and serves real users, so this is not
> hypothetical. It is also `status: draft` — meaning it describes what the code does,
> not a reviewed policy. **Do not treat it as legal advice or as a compliance sign-off.**

---

## What is recorded

### Account data (`users` table)

| Field | What it is | Sensitivity |
|---|---|---|
| `email` | login identifier | **PII** |
| `first_name`, `last_name` | real name | **PII** |
| `username` | public handle | public |
| `password` | hashed | **credential** |
| `forget_code` | password-reset OTP | **credential** |
| `image` | profile photo | **PII** |
| `short_description` | user-authored bio | user content |
| `tiktok`, `youtube`, `instagram`, `twitter`, `facebook`, `website` | social handles | **PII** — links this account to identities elsewhere |
| `device_token`, `fcm_token`, `device_type` | push notification targeting | **device identifier** |
| `login_count`, `last_login` | activity | behavioural |
| `role_id`, `user_type` | authorization | internal |

### Behavioural data

| Where | What it records |
|---|---|
| `restaurant_tag` | user_id + restaurant + tag — **who said what about where** |
| `restaurant_user` | which restaurants a user saved |
| photos | user-uploaded images, attributed to the uploader |
| image likes | which user liked which photo |
| lists | user-created lists and their contents |

### Third parties that receive data

| Service | What reaches it |
|---|---|
| Firebase FCM | device tokens, notification payloads |
| Google / Apple OAuth | authentication exchange |
| Supabase | **all of the above** — it is the database |
| Google Places / Anthropic / Voyage AI | restaurant data and review text. **[inferred]** no user PII is sent — the pipeline operates on venue data — but this has not been audited. |
| PostHog / GA4 / AdSense | **web only.** Behind the Consent Mode v2 CMP. |

---

## 🔴 Known problems in how this is handled

Stated plainly, because a privacy doc that omits the defects is worse than none.

| Problem | Effect |
|---|---|
| **OAuth login stores the raw provider token as an unhashed password** (TODO-009) | A credential sits in the database in plaintext |
| **Password-reset OTP never expires** (TODO-020) | An intercepted `forget_code` is valid forever |
| **`user_id` accepted from request bodies** on several endpoints (TODO-006, TASK-03) | One user can act on another's data |
| **No deletion path exists** | See below — this is the largest gap |

---

## Retention and deletion

**There is no data-retention policy, and no account-deletion mechanism in the API.**

I checked: there is no `DELETE /user`, no account-closure endpoint, no anonymisation
routine, and no scheduled purge anywhere in the codebase. Data is kept indefinitely by
default — not by decision, but by absence of a decision.

This matters concretely:

- **Apple App Store guideline 5.1.1(v)** requires apps offering account creation to
  offer in-app account deletion. This app creates accounts and is live. **[inferred]** —
  I have not checked the current App Store review status, and requirements change.
  **Verify against Apple's current guidelines before the next submission.**
- GDPR/UK-GDPR erasure and CCPA deletion rights have no technical means of being
  honoured today.

The only retention setting that *is* configured: **GA4 event and user data set to 14
months** (web analytics only — not the app database).

| Data | Retention today | Should be |
|---|---|---|
| Account records | indefinite | _TODO_ |
| Tag/save history | indefinite | _TODO_ |
| Uploaded photos | indefinite | _TODO_ |
| Device tokens | indefinite — **stale tokens are never pruned** | _TODO_ |
| Password-reset OTPs | indefinite — never expire | minutes |
| GA4 web analytics | 14 months ✅ | — |

---

## Published policy

- Marketing: `www.tastemakersapp.com/privacy` (static HTML)
- Web app: `src/app/(public)/privacy/page.tsx`
- This URL was given to Google AdSense during review

**[unknown]** — whether the published policy accurately describes the practices above.
**It should be read against this document.** A policy that promises deletion the code
cannot perform is a worse problem than no policy.

---

## Actions this document surfaces

1. **Build account deletion.** Likely App Store compliance exposure, and there is no
   way to honour an erasure request today.
2. **Set retention periods** for the rows marked _TODO_ above.
3. **Expire password-reset OTPs.**
4. **Stop storing OAuth tokens as passwords.**
5. **Reconcile the published privacy policy** against what the code actually does.
6. **Audit the AI pipeline** to confirm no user PII reaches Anthropic, Voyage, or Google.

<!-- TODO(james): I could not determine from the code:
     - Where uploaded photos physically live (S3? Railway disk? Foursquare CDN?) and who can read them
     - Whether user location is ever STORED (nearByCuisine receives lat/lng, but storage is unclear)
     - Whether any data is shared with, or retained by, the original contractor
     - Whether a DPA exists with Supabase / Railway
     These are the gaps that matter most for a real policy. -->
