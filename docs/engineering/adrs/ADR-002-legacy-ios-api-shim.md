---
id: ADR-002
type: adr
status: active
phase: null
owner: james
tags: [web, ios, routing, compatibility]
links: [RISK-004, RM-01, DOC-006, SOL-006]
updated: 2026-08-18
---

# ADR-002: Forward `/v2/api` from the web app to the Laravel API

**Decision status:** Accepted and shipped 2026-08-18 (PR #33). Hardened 2026-08-18
(this branch). Removal gated on TASK-24.

---

## Context

The App Store binary builds every API request from a single constant:

```swift
// tastemakers-ios/TasteMaker/NetworkManager/NetworkManager.swift:14
case baseUrl = "https://tastemakersapp.com/v2/api/"
```

That path was the Namecheap layout, where Laravel lived in a `/v2/` subdirectory. It has
not existed since the Railway migration, so **every API call from every installed copy of
the app 404s** — consistent with tag creation falling to 44 rows in 2025.

The constraint that drives the decision: iOS versions stay installed for months. Shipping
a corrected build does not repair the installed base. Only a server-side change can.

## Decision

Forward `/v2/api/:path*` to `https://api.tastemakersapp.com/api/:path*` with a Next.js
rewrite in `tastemakers-web/next.config.ts`, because the apex domain now serves that app.

## Alternatives rejected

| Option | Why not |
|---|---|
| Handle `/v2/api` in Laravel | The requests go to `tastemakersapp.com`, which Laravel never sees. Would need the domain split back apart, and Railway Hobby caps domains at 2/service. |
| A CDN / edge rule | The genuinely correct layer. DNS authority is Squarespace, so this means migrating nameservers to Cloudflare — far larger than the outage warranted. |
| Redirect (308) instead of rewrite | `URLSession` strips `Authorization` across a cross-host redirect, breaking every authenticated call, and adds an RTT per request on mobile. |
| Do nothing, ship a new build | Abandons the installed base for months. |

## Consequences

**Accepted, and they are not small:**

1. **The mobile installed base now depends on the web service's availability.** A web
   deploy, bad build, or OOM takes down every shipped iOS client while Laravel is healthy.
   Web deploys are mobile-affecting changes from now on.
2. **The whole Laravel API surface is exposed on this domain.** The `next.config.ts`
   comment previously argued *against* an `/api/*` proxy on the grounds that it "would
   expose the whole Laravel surface through this domain" — but that is precisely what this
   rewrite does, one prefix over. The narrowness is a *correctness* property (it cannot
   shadow `src/app/api` handlers, so unmatched paths 404 instead of 500), not a security
   one. That comment has been corrected rather than left to justify a future decision.
3. **A second network hop.** Requests exit Railway and re-enter through a different edge
   (`lax1` → `sjc1` observed), paying an extra TLS handshake. See todo 115.
4. **Redirects become dangerous.** Redirects evaluate before rewrites, so any redirect
   capturing `/v2/api` silently converts POSTs to GETs. Guarded by a test.

**Compensating controls, all enforced by tests or code:**

- `src/middleware.ts` short-circuits this prefix: strips `Cookie` (so Supabase tokens
  never reach Laravel), strips client-supplied `x-forwarded-*`, and forces
  `Accept: application/json` so Laravel returns 401 JSON rather than a 302 to a plaintext
  `http://` URL that App Transport Security blocks.
- `src/app/robots.ts` disallows `/v2/api`.
- `src/lib/api-routes.test.ts` asserts the shim against the **executed** config, so a
  commented-out block, a template-literal source or an env-conditional return all fail.
- The destination is hardcoded for every build and only overridable in `development`,
  so an unset or stale env var cannot silently break the installed base — the SOL-006
  failure mode.

## Why this is an ADR and not a decision-log line

`CLAUDE.md` reserves ADRs for decisions that are expensive to reverse and for module
boundaries. This is both. It creates a cross-repo boundary between `tastemakers-web` and
`tastemakers-ios` that cannot be unwound without an App Store cycle plus months of soak,
and the coupling is invisible from the iOS side — `NetworkManager.swift` now carries a
comment pointing here.

## Exit

TASK-24. The shim is removable once a build that abandons the legacy prefix has shipped
**and drained**, measured as `/v2/api/*` under 10 requests/day for 30 consecutive days.
That measurement does not exist yet, which is the open half of the task: PostHog is a
browser library and never observes a `URLSession` call.
