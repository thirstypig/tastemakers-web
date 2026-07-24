---
id: SOL-004
type: solution
status: done
owner: james
links: [DOC-011, DOC-010]
updated: 2026-07-24
title: "next build fails with \"Module not found: Can't resolve 'fs'\" after a client component imports a server-only lib"
slug: "nextjs-client-component-importing-fs-module-not-found"
category: "build-errors"
problem_type: "client_server_boundary_violation"
symptoms:
  - "next build: Module not found: Can't resolve 'fs' — Import trace for requested module: ./src/app/admin/docs/DocsBrowser.tsx"
  - "Failed to compile. > Build failed because of webpack errors"
  - "npm run type-check passes cleanly"
  - "Full test suite passes (174/174) — vitest runs in node, where fs resolves fine"
  - "npm run dev may appear to work; only the production build fails"
component: "src/lib/docs.ts, src/lib/docs-filter.ts, src/app/admin/docs/DocsBrowser.tsx"
environment: "Next.js 15 App Router, webpack, vitest (environment: node), Node 22"
tags: ["nextjs", "webpack", "client-component", "use-client", "fs", "module-not-found", "build-failure", "server-only", "bundler", "app-router"]
severity: "medium"
date_solved: "2026-07-24"
time_to_solve: "~5 min once the build ran — but the bug existed through a passing typecheck and a passing 174-test suite"
related:
  - "SOL-001 (same repo, also a build-only failure invisible to typecheck)"
  - "DOC-010 testing-strategy — why 'tests pass' is not 'it builds'"
---

# `next build` fails with "Can't resolve 'fs'" after a client component imports a server-only lib

## Symptom

`npm run build` dies at compile with:

```
Failed to compile.

./src/lib/docs.ts
Module not found: Can't resolve 'fs'

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./src/app/admin/docs/DocsBrowser.tsx

> Build failed because of webpack errors
```

**What makes it sneaky:** at the moment this failed, `npm run type-check` was clean and
**all 174 tests passed.** Nothing else in the toolchain sees the problem.

## What was happening

`src/lib/docs.ts` reads the filesystem to auto-walk `docs/`, so it imports Node builtins
at module scope:

```ts
import fs from "fs";
import path from "path";
```

A pure, browser-safe search helper was added to that same file so it could be unit
tested — the repo's established convention is "testable logic goes in `src/lib/`":

```ts
// src/lib/docs.ts  — alongside the fs import
export function matchesQuery(doc, query) { /* pure string matching */ }
```

Then the **client** component imported it:

```tsx
// src/app/admin/docs/DocsBrowser.tsx
"use client";
import { matchesQuery } from "@/lib/docs";   // ← the mistake
```

## Root cause

**Webpack resolves the whole module, not just the imported symbol.**

`"use client"` marks `DocsBrowser.tsx` for the browser bundle. Webpack follows its
import graph, reaches `src/lib/docs.ts`, and must resolve **every** top-level import in
that file — including `fs` and `path`, which have no browser implementation. It fails.

It does not matter that `matchesQuery` never touches `fs`. Tree-shaking runs *after*
module resolution; resolution fails first.

**Why nothing else caught it:**

| Tool | Why it passed |
|---|---|
| `tsc --noEmit` | `fs` has real type definitions. Types are correct — it's a *bundling* constraint, not a type constraint. |
| `vitest` | `vitest.config` uses `environment: "node"`, where `fs` resolves normally. Tests import the same module happily. |
| `next dev` | Dev compiles lazily per route and is more forgiving; the failure surfaces reliably only in the production build. |

## Solution

Move browser-safe helpers into their own module with **no Node imports**. Nothing else
changes.

**1. New module, deliberately Node-free:**

```ts
// src/lib/docs-filter.ts
/**
 * Doc search — deliberately in its own module with NO Node imports.
 *
 * `docs.ts` imports `fs`/`path` at module scope, so anything a CLIENT component
 * imports from it drags `fs` into the browser bundle and the build fails with
 * "Module not found: Can't resolve 'fs'". Keep browser-safe helpers here.
 */
export type SearchableDoc = { title: string; id: string; path: string; tags: string[] };

export function matchesQuery(doc: SearchableDoc, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    doc.title.toLowerCase().includes(needle) ||
    doc.id.toLowerCase().includes(needle) ||
    doc.path.toLowerCase().includes(needle) ||
    doc.tags.some((t) => t.toLowerCase().includes(needle))
  );
}
```

**2. Leave a breadcrumb in the server-only module** so the next person doesn't repeat it:

```ts
// src/lib/docs.ts
// Search lives in ./docs-filter — this module imports `fs`, so client components
// must never import from here. See the note at the top of docs-filter.ts.
```

**3. Repoint the client import:**

```diff
- import { matchesQuery } from "@/lib/docs";
+ import { matchesQuery } from "@/lib/docs-filter";
```

**Verified:** `type-check` clean · 174/174 tests · `✓ Compiled successfully`.

## Prevention

**The rule:** a module that imports `fs`, `path`, `child_process`, or any Node builtin
is **server-only**. Never import from it in a file marked `"use client"` — not even a
pure function that lives there.

**Practical habits:**

1. **Split by runtime, not just by concern.** `foo.ts` (server) and `foo-filter.ts`
   (browser-safe) is a fine, cheap split. Put the reason in a comment at the top of the
   browser-safe file, or someone will "tidy" it back together.
2. **Pass data as props instead of importing.** The page (a Server Component) already
   fetched everything; the client component should receive plain serialisable props.
   `import type` is always safe — types are erased at compile time.
3. **Consider `import "server-only"`** at the top of genuinely server-only modules. It
   turns this into a clearer, earlier error naming the boundary rather than a bare
   missing-module message.
4. **Run `npm run build` before pushing, not just tests.** This is the load-bearing
   habit — see below.

**Test suggestion** (guards the boundary without a full build):

```ts
// A client component must not transitively import the fs-using module.
it("DocsBrowser does not import the server-only docs module", () => {
  const src = fs.readFileSync("src/app/admin/docs/DocsBrowser.tsx", "utf-8");
  expect(src).not.toMatch(/from ["']@\/lib\/docs["']/);
});
```

## The generalisable lesson

**"Tests pass" is not "it builds."**

Typecheck validates types. Unit tests validate behaviour in a Node environment. Neither
validates that the module graph can be bundled for a browser. Client/server boundary
violations, and some import-resolution failures, are visible **only** to the bundler.

This is the second build-only failure in this repo that a green typecheck and a green
test suite did not catch — see `SOL-001`. The pattern is consistent enough to be a rule:
**for any change touching `src/`, the pre-push gate is `type-check` + `test` + `build`,
in that order.** The first two are fast; the third is the one that finds this class.

## Related

- `SOL-001` — Next.js build failing on stale route types; also invisible to typecheck
- `DOC-010` (testing strategy) — what each layer does and does not verify
- `DOC-011` (component library) — `DocsBrowser` and the admin client tree
