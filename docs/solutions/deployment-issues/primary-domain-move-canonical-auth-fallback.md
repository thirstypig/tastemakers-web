---
id: SOL-006
type: solution
status: done
owner: james
links: [SOL-002, SOL-005, DOC-020, DOC-007]
updated: 2026-08-18
title: "Moving the primary domain broke sign-in, the apex, and a canonical fallback that stayed wrong silently"
slug: "primary-domain-move-canonical-auth-fallback"
category: "deployment-issues"
problem_type: "config_correct_when_written_then_silently_stale"
symptoms:
  - "www still served the OLD marketing site after a full redesign — because www and app. were different Railway services from different repos"
  - "Apex returned SSL: no alternative certificate subject name matches, then {\"status\":\"error\",\"code\":404,\"message\":\"Application not found\"}"
  - "Sign-in silently redirected users to a host that had just been deleted from DNS"
  - "Unmatched /api/* returned 500 Internal Server Error in production, not 404"
  - "Canonical fallback named a retired domain; nine tests asserted the dead value and protected it"
component: "next.config.ts, src/lib/site.ts, src/lib/auth.ts, Squarespace DNS, Railway custom domains, Supabase URL Configuration"
environment: "Next.js 15 App Router, Railway (Hobby), Squarespace DNS (ns-cloud-*.googledomains.com), Supabase Auth + Google OAuth, Laravel 8 API on a separate service"
tags: ["dns", "custom-domains", "railway", "squarespace", "canonical", "seo", "sitemap", "supabase", "oauth", "env-vars", "nextjs", "redirects", "domain-migration"]
severity: "high"
date_solved: "2026-08-18"
time_to_solve: "~1 session across 4 PRs (#27–#30) — the last bug was found only by adversarially fact-checking claims already made"
related:
  - "SOL-002 — same family: NEXT_PUBLIC_SITE_URL exists because Railway's request.url is the internal localhost:8080"
  - "SOL-005 — the other 'production looked fine and wasn't' bug; metadata survived while the body did not"
  - "DOC-020 runbook — 'Custom domain stops resolving'; DNS authority is Squarespace, registrar is Namecheap"
  - "TASK-19 — numeric restaurant URLs still do not 301 to the canonical slug"
---

# Moving the primary domain broke sign-in, the apex, and a canonical fallback that stayed wrong silently

Four failures, one shape: **every one was a value that was correct when written and became wrong when something else moved.** None produced an error at the time it broke.

## Symptom

The trigger was a question, not an alarm: *"`www.tastemakersapp.com` is still the old page — I thought we changed it?"*

Nothing was broken. `www` and `app.` were **two different Railway services deployed from two different repos**:

| Host | Railway service | Repo | Served |
|---|---|---|---|
| `www` + apex | `tastemakers-marketing-production` | `tastemakers-marketing` | 489-line static HTML, 15.7 KB, **zero `<h1>`**, Mailchimp form |
| `app.` | `tastemakers-web` | `tastemakers-web` | Next.js 15 app, 99.5 KB, one `<h1>`, beehiiv form |

An entire redesign had shipped to `app.` The brand domain — the one the App Store listing, backlinks and brand searches point at — served a dead page and a mailing list that was being abandoned.

Then the migration itself broke three more things.

## Root cause

### 1. The apex 404'd mid-migration — a sequencing error

Removing the apex from the marketing service was step 1; re-adding it to the web service was step 4. In between, the DNS `A` record still pointed at Railway's edge, but **no Railway service claimed that hostname**:

```
https://tastemakersapp.com
  → SSL: no alternative certificate subject name matches
  → cert presented: CN=*.up.railway.app
  → {"status":"error","code":404,"message":"Application not found"}
```

A browser security warning is strictly worse than the stale page it replaced. The two operations belong in one step.

### 2. Sign-in broke silently, in two independent places

`redirectTo` is built from `window.location.origin`, so a user on `www` asks Supabase to return them to `https://www.tastemakersapp.com/auth/callback`. That URL was not in the allowlist, and **Supabase does not error on an unlisted `redirectTo` — it falls back to the Site URL**, which was `https://app.tastemakersapp.com`: a host that had just been deleted.

Independently, `resolveCallbackOrigin` reads `NEXT_PUBLIC_SITE_URL`, still set to the same dead host. So even a corrected Supabase allowlist would have bounced users to nowhere.

The auth allowlist has to move **before** the domain it points at is retired.

### 3. `/api/*` returned 500, not 404

`next.config.ts` carried a fallback rewrite to `http://localhost:4050` — the local dev port, shipped to production. Measured against the live site before the fix:

```
www.tastemakersapp.com/api/login              → 500 Internal Server Error
www.tastemakersapp.com/api/restaurant-detail  → 500
api.tastemakersapp.com/api/login              → 405   ← real Laravel, healthy
```

The comment above it claimed those paths *"still proxy to Laravel."* In production they proxied to nothing. Nothing depended on it — this app reads Supabase directly (TODO-089) and every `/api/*` path it fetches is a Next route handler.

### 4. The one that stayed broken — a fallback nobody could see

The canonical-origin refactor replaced 15 hardcoded hosts with one constant:

```ts
const DEFAULT_ORIGIN = "https://app.tastemakersapp.com";
```

**That was correct when written.** Defaulting to the then-live origin is exactly what made the refactor byte-identical to production, which is what made it safe to ship.

Retiring `app.` inverted it — and **a fallback is invisible while the environment variable is set.** `NEXT_PUBLIC_CANONICAL_ORIGIN` is absent from `.env.local`, so any build without it set on the host would publish canonicals, JSON-LD and a sitemap on a domain that NXDOMAINs. Production stayed correct only by virtue of the Railway variable.

Worse: **nine assertions in `site.test.ts` hardcoded the dead value.** The suite was protecting the broken default.

This surfaced only when a subagent was asked to *adversarially refute* claims that had already been made and shipped.

## The fix

### Two site-URL variables, never merged

They answer different questions, and conflating them is a live bug:

| Variable | Question | Local dev | Consumer |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | "where is *this instance* reachable?" | `http://localhost:3050` — **correctly**; an OAuth callback must return to the machine that sent the user away | `resolveCallbackOrigin` (`src/lib/auth.ts`) |
| `NEXT_PUBLIC_CANONICAL_ORIGIN` | "what is the *public home* of this content?" | unset → production default | `CANONICAL_ORIGIN` / `canonical()` (`src/lib/site.ts`) |

Had canonicals derived from the auth variable, any local `next build` would publish localhost canonicals and a localhost sitemap.

### Name the failure mode instead of re-encoding a literal

```ts
// — BEFORE: correct on the day, wrong the moment app. was retired
const DEFAULT_ORIGIN = "https://app.tastemakersapp.com";

// — AFTER
const DEFAULT_ORIGIN = "https://www.tastemakersapp.com";
/** Hosts this site no longer answers on. A fallback must never name one. */
export const RETIRED_ORIGINS = ["https://app.tastemakersapp.com"];
```

A test asserting `RETIRED_ORIGINS` does not contain the resolved default survives the next domain move. Nine assertions hardcoding a hostname do not — they just re-encode the next stale value.

### The migration order that works

1. **Railway:** remove the hostname from the old service, add it to the new one, in one step. Copy the CNAME **and** TXT values — Railway will not verify with only the CNAME.
2. **Auth allowlists BEFORE retiring anything.** Supabase → Authentication → URL Configuration: Site URL + every host the app answers on. Google Cloud Console → Google Auth Platform → Clients: **only** Authorized JavaScript origins. The Authorized redirect URI stays `https://<project-ref>.supabase.co/auth/v1/callback` — editing it breaks sign-in.
3. **DNS:** Squarespace → domain → DNS → DNS Settings → Custom Records. `ALIAS` supports `@`; `CNAME` does not. Never a raw `A` record at the apex — Railway offers no static IPs, and the previous hand-copied edge IP would have broken on rotation.
4. **Then** flip `NEXT_PUBLIC_CANONICAL_ORIGIN` and redeploy. `NEXT_PUBLIC_*` is inlined at **build** time; setting it without a redeploy does nothing.

## Result

| | before | after |
|---|---|---|
| `www` | old static site, 15.7 KB, **0 `<h1>`** | Next.js app, 99.5 KB, 1 `<h1>` |
| apex | SSL error + `Application not found` | 200, own Let's Encrypt cert |
| canonical / robots / sitemap | `app.` | `www` (98 `<loc>` entries) |
| auth callback | dead host | `www` |
| unmatched `/api/*` | **500** | 404 |
| fallback origin | NXDOMAIN host | live host, guarded |

Apex and `www` both serve **200** — the apex is *not* a redirect. Duplicate content is consolidated by `rel=canonical` alone, which is a hint rather than a directive. A 308 apex→`www` would be stronger; it is deliberately deferred because [TASK-19] shows redirects here need care.

## Prevention

1. **A fallback must name something that resolves.** Any default that duplicates current live config becomes wrong the moment that config moves, and stays silent because the fallback never executes while the variable is set. Assert against a named list of *retired* values, not against the current one.
2. **Retire a hostname last.** Auth allowlists, env vars and canonical config all move first. Supabase silently substitutes the Site URL for an unlisted `redirectTo` — no error, no log.
3. **Two URL concepts, two variables.** "Where am I reachable" and "what is my public home" diverge in dev and during any migration.
4. **Grep the config for dev-only hosts before shipping.** `localhost` in `next.config.ts` produced a 500, not a 404, so it looked like a server fault rather than a missing route.
5. **`curl` after the deploy, per host.** A green build says nothing about which hostname serves what — see SOL-005 for the same lesson in a different guise.
6. **Ask something to refute your claims, not confirm them.** Bug #4 had already shipped and been described as done. It was found by a fact-check pass told to be adversarial and to prefer refuting.

## The generalisable lesson

The four bugs look unrelated — DNS, OAuth, a proxy, a constant — but they are one failure mode: **config that encodes a fact about the world at the moment it was written, with nothing tying it to that fact later.**

`DEFAULT_ORIGIN` is the purest case, because it was not a mistake. It was the *right* value, chosen deliberately to make a 15-file refactor provably safe, and the reasoning was sound. It rotted because something else changed, and the design guaranteed nobody would notice: a fallback that never runs cannot fail loudly.

The durable fix is never a better literal. It is encoding the *invariant* — "the default must not be a retired host" — so the assertion still means something after the value changes.
