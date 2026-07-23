---
id: SOL-001
type: solution
owner: james
tags: [web, infra]
links: []
updated: 2026-06-03
title: 'Next.js build fails on host with "Cannot find module src/app/page.js" after deleting a route'
category: build-errors
problem_type: build_failure
component: nextjs-app-router
status: solved
verified: true
date: 2026-06-03
severity: medium
symptoms:
  - "next build: error TS2307 Cannot find module '../../../src/app/page.js'"
  - "Build fails at 'Linting and checking validity of types ...' immediately after '✓ Compiled successfully'"
  - "Fails only on the host (Vercel) with restored build cache; a clean local build passes"
tags: [nextjs, vercel, railway, build-cache, app-router, typescript, generated-types]
related:
  - "memory: reference_railway_vercel (why Vercel was removed; Railway-only)"
---

## Problem Symptom

A hosted Next.js 15 (App Router) build failed during the type-check phase, while the
compile step succeeded:

```
✓ Compiled successfully in 15.7s
   Linting and checking validity of types ...
   .next/types/app/page.ts(2,24): error TS2307: Cannot find module '../../../src/app/page.js'
```

Key tells:
- The error is in a **generated** file under `.next/types/`, not in source.
- It references `src/app/page.js` — a route module that **no longer exists**.
- It reproduced on Vercel, which logged **"Restored build cache from previous deployment"**.

## Environment

- Next.js 15.5.x, App Router, `src/` directory, strict TypeScript.
- Earlier in the session, `src/app/page.tsx` (a `/ → /restaurants` redirect) was **deleted**
  and replaced by `src/app/(site)/page.tsx` (a route group) that now serves `/`.
- Local builds passed; the failure appeared only on the host.

## Investigation (what was tried)

1. **Saw the same error locally — twice — right after deleting `page.tsx`** but *before*
   rebuilding (`npm run type-check` failed with the identical `Cannot find module src/app/page.js`).
2. **A fresh `npm run build` made it disappear locally.** That hinted the generated types,
   not the source, were stale.
3. **Isolated cache vs. code with a cache-free build of the exact failing commit:**
   ```bash
   git checkout main && git pull --ff-only      # sync to the commit the host built
   rm -rf .next                                  # drop ALL cache, like a fresh host build
   npm run build
   # → ✓ Compiled successfully + Generating static pages (134/134), exit 0
   ```
   Clean build passes → the code is fine; the failure is the **restored build cache**.

## Root Cause

Next.js App Router generates a per-route type file under `.next/types/app/**` (e.g.
`.next/types/app/page.ts`) that `import`s the route's module. When a route file is
**deleted or moved into a route group** (`src/app/page.tsx` → `src/app/(site)/page.tsx`),
an **incremental** build does not always prune the orphaned generated type file. The
orphan keeps `import`-ing `../../../src/app/page.js`, which is gone.

`next build`'s "Linting and checking validity of types" step type-checks `.next/types/**`,
so `tsc` errors with `Cannot find module`. A *clean* build regenerates `.next/types` from
scratch and the orphan disappears — but a host that **restores `.next/cache` from a
deployment created before the deletion** reintroduces the stale file, so the host build
fails where a clean local build succeeds.

## Solution

Clear the host's build cache and redeploy. One clean build regenerates the cache correctly;
subsequent deploys work with cache enabled again. **No code change is required.**

- **Vercel:** Deployments → the failed deployment → ⋯ → **Redeploy** → uncheck
  **"Use existing Build Cache"** → Redeploy.
- **CLI equivalent:** force a no-cache build (`vercel --force`, or your platform's
  "clear cache and deploy").

In this project the fix was ultimately moot — Vercel was a **redundant** deploy target
(prod is Railway) and was removed afterward — but the cache-clear is the general answer for
any host (Railway/Vercel/CI) that caches `.next`.

## Prevention

- **After deleting or moving a route file, run a cache-free build before trusting type-check:**
  ```bash
  rm -rf .next && npm run build
  ```
  This is the canary that distinguishes a *real* type error from a *stale-cache* artifact.
- **Pattern-match the error:** `next build` failing at type-checking with
  `Cannot find module 'src/app/<something>.js'` for a path that no longer exists is a
  **stale generated-types / build-cache** problem, not a code bug — clear the cache, don't
  "fix" the code.
- For CI/hosts: invalidate the build cache (or exclude `.next/types`) on commits that delete
  routes, if recurring.

## Cross-references

- Directly motivated removing the redundant Vercel deploy and going **Railway-only**
  (see memory `reference_railway_vercel`). Railway clones fresh per deploy but also caches
  builds — the same class of issue is fixed the same way (clear build cache).
