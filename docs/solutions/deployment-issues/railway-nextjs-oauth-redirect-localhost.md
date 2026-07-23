---
id: SOL-002
type: solution
status: done
owner: james
links: [DOC-020]
updated: 2026-06-10
title: "Next.js Railway OAuth redirect resolves to localhost:8080 instead of public domain"
slug: "railway-nextjs-oauth-redirect-localhost"
category: "deployment-issues"
problem_type: "misconfiguration"
symptoms:
  - "Post-Google OAuth login redirects to localhost:8080/explore instead of app.tastemakersapp.com"
  - "Users cannot complete login on production Railway deployment"
  - "Admin middleware rejects valid sessions due to ADMIN_EMAILS env var typo"
component: "src/app/auth/callback/route.ts"
environment: "Railway (Next.js 15, production)"
tags: ["nextjs", "railway", "oauth", "google-auth", "supabase", "redirect", "env-var", "middleware", "reverse-proxy"]
severity: "critical"
date_solved: "2026-06-08"
time_to_solve: "~1 session"
related:
  - docs/solutions/build-errors/nextjs-deleted-route-stale-build-cache-types.md
---

## Problem

After Google OAuth login on `https://app.tastemakersapp.com/admin/login`, the auth callback
redirected users to `https://localhost:8080/explore` — an unreachable internal address.

Secondary symptom: after the origin fix, the login looped back to `/admin/login` with no
`?error=auth_failed` query parameter, indicating the session was set but the middleware was
rejecting it.

## Root Cause

**Primary:** Railway injects `PORT=8080` and runs the Next.js process on that internal port.
Inside server-side code — Route Handlers, API routes, Server Components — `request.url`
reflects the internal network address (`http://localhost:8080/auth/callback`), **not** the
public domain. The auth callback was deriving its redirect origin from `request.url`:

```typescript
// BROKEN — origin = "http://localhost:8080" on Railway
const { searchParams, origin } = new URL(request.url);
return NextResponse.redirect(`${origin}/explore`);
```

**Secondary:** `ADMIN_EMAILS` in Railway had a typo (`jimmyc316@gmail.com` vs
`jimmychang316@gmail.com`). The session was set correctly — but the middleware email
allowlist check silently rejected it and issued a clean redirect to `/admin/login`.

## Investigation Steps

1. **Ruled out client-side origin** — browser DevTools confirmed `window.location.origin`
   was `https://app.tastemakersapp.com`. The redirect URL was being built server-side.

2. **Ruled out OAuth URL generation** — Playwright inspection of the Google OAuth URL showed
   `redirect_to=https://app.tastemakersapp.com/auth/callback` was correctly encoded. Supabase
   was sending the right URL to Google.

3. **Isolated the Route Handler** — traced `src/app/auth/callback/route.ts` and found
   `new URL(request.url).origin`. On Railway, this is `http://localhost:8080`.

4. **Rejected `x-forwarded-host` approach** — using `x-forwarded-host` and
   `x-forwarded-proto` headers to reconstruct the public origin is an **open redirect
   vulnerability**: these headers are client-controlled and can be spoofed to redirect users
   to arbitrary domains after authenticating.

5. **Diagnosed secondary issue** — the `?error=auth_failed` signal: its presence means
   `exchangeCodeForSession` failed; its *absence* on a `/admin/login` redirect means the
   exchange succeeded but middleware blocked the session. Checked `ADMIN_EMAILS` in Railway
   → typo found.

## Working Solution

Extract a `resolveCallbackOrigin` helper that prefers `NEXT_PUBLIC_SITE_URL` (explicitly
set in Railway) over `request.url` origin. Never fall back to `x-forwarded-host`.

```typescript
// src/lib/auth.ts — pure function, unit-testable
export function resolveCallbackOrigin(requestUrl: string): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    new URL(requestUrl).origin  // safe for local dev (localhost:3050)
  );
}
```

```typescript
// src/app/auth/callback/route.ts
import { resolveCallbackOrigin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = resolveCallbackOrigin(request.url); // ← never localhost:8080
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/explore";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const errorRedirect = next.startsWith("/admin")
    ? `${origin}/admin/login?error=auth_failed`
    : `${origin}/login?error=auth_failed`;
  return NextResponse.redirect(errorRedirect);
}
```

Fix for the secondary issue: correct `ADMIN_EMAILS` in Railway to exactly match the
Google account email — character for character, no spaces, correct spelling.

## Diagnostic Signal Reference

| Symptom after OAuth | Meaning | Check |
|---|---|---|
| Redirects to `localhost:8080/...` | `request.url` used as redirect origin | Use `NEXT_PUBLIC_SITE_URL` |
| `/admin/login?error=auth_failed` | `exchangeCodeForSession` failed | Check Supabase anon key, code expiry |
| `/admin/login` (no error param) | Session set, middleware blocked | Check `ADMIN_EMAILS` exact spelling |
| `/login?error=auth_failed` | Exchange failed, non-admin route | Check Supabase URL config |

## Prevention Checklist

Before deploying any auth callback route to Railway (or any reverse proxy):

- [ ] Search auth files for `request.url` — audit every usage; never derive redirect origin from it
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` is set in Railway Variables to the full `https://` public URL
- [ ] Copy-paste env var values from `.env.local` to Railway — never retype (prevents typos)
- [ ] After setting Railway env vars, trigger a manual redeploy (env changes don't auto-restart)
- [ ] Confirm `ADMIN_EMAILS` (or equivalent allowlist) matches exactly what the auth provider returns
- [ ] Verify Supabase redirect URL allowlist includes `https://app.yourdomain.com/auth/callback`

## Railway-Specific Gotchas

**`request.url` is the internal URL, always.** Railway proxies all traffic. Inside the
container, `PORT` is the internal port (default 8080). `request.url` is
`http://localhost:PORT/...`. There is no automatic header injection of the public URL —
you must supply it via an env var.

**`x-forwarded-host` is client-controlled.** Do not use it to build redirect targets in
auth callbacks — this is an open redirect vulnerability. Pin the public origin via an
explicit env var instead.

**`.env.local` is never read on Railway.** Only vars set in the Railway dashboard (or via
`railway variables set`) are available. A var that works locally may silently be `undefined`
in production.

**Env var changes require a redeploy.** Changing a Railway env var does not restart the
service. Trigger a manual redeploy after any auth-critical env var change.

## Tests That Prevent This Regression

Added to `src/lib/auth.test.ts`:

```typescript
describe("resolveCallbackOrigin", () => {
  it("uses NEXT_PUBLIC_SITE_URL when set (production Railway case)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.tastemakersapp.com");
    expect(resolveCallbackOrigin("http://localhost:8080/auth/callback?code=abc"))
      .toBe("https://app.tastemakersapp.com");
  });

  it("never returns localhost:8080 when NEXT_PUBLIC_SITE_URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.tastemakersapp.com");
    const result = resolveCallbackOrigin("http://localhost:8080/auth/callback");
    expect(result).not.toContain("localhost:8080");
  });

  it("falls back to request.url origin when NEXT_PUBLIC_SITE_URL is unset (local dev)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(resolveCallbackOrigin("http://localhost:3050/auth/callback?code=abc"))
      .toBe("http://localhost:3050");
  });
});
```

Also added to `src/lib/auth.test.ts` (secondary regression):

```typescript
it("rejects when email has a typo vs allowList (jimmyc316 vs jimmychang316)", () => {
  expect(isEmailAllowed("jimmychang316@gmail.com", ["jimmyc316@gmail.com"])).toBe(false);
  expect(isEmailAllowed("jimmychang316@gmail.com", ["jimmychang316@gmail.com"])).toBe(true);
});
```
