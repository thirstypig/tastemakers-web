---
id: SOL-005
type: solution
status: done
owner: james
links: [SOL-004, SOL-001, DOC-010]
updated: 2026-08-17
title: "Every page reached crawlers empty — useSearchParams in a provider shared the root Suspense boundary with the whole app"
slug: "usesearchparams-suspense-bailout-empty-ssr"
category: "rendering-issues"
problem_type: "csr_bailout_silent_ssr_loss"
symptoms:
  - "curl of a statically generated page returns HTML with zero <h1> tags"
  - "Restaurant page was 26,589 bytes of shell + RSC payload; no rendered tag cloud, no address, no result rows"
  - "Page looks completely correct in a browser and in screenshots — hydration fills it in"
  - "npm run build succeeds; 333 tests pass; tsc --noEmit clean; 176 static pages generated"
  - "Metadata and JSON-LD DO survive, so <title> and rel=canonical look fine and mislead"
component: "src/app/layout.tsx, src/components/providers/PostHogProvider.tsx, src/features/shell/AppNav.tsx"
environment: "Next.js 15 App Router, React 19, statically generated routes (generateStaticParams), posthog-js/react"
tags: ["nextjs", "app-router", "use-client", "useSearchParams", "suspense", "csr-bailout", "ssr", "seo", "static-generation", "prerender", "posthog"]
severity: "high"
date_solved: "2026-08-17"
time_to_solve: "~40 min — but it shipped to production first, and had been latent for the whole redesign"
related:
  - "SOL-001 and SOL-004 — same family: real failures invisible to typecheck and the test suite"
  - "TODO-089 — web reads Supabase directly rather than the Laravel API"
---

# Every page reached crawlers empty because `useSearchParams` shared a Suspense boundary with the app

## Symptom

The site rendered perfectly in a browser. It was empty to anything that doesn't run JavaScript.

```bash
curl -s https://app.tastemakersapp.com/restaurants/langer-s-delicatessen-restaurant-159 \
  | grep -c '<h1'
# 0
```

26,589 bytes came back — an HTML shell plus a serialised RSC payload — with:

- no `<h1>`
- no rendered tag cloud (`tm-cloud-chips` absent)
- no address, no result rows
- the restaurant name appearing only inside the flight data, not as DOM

Every one of these passed while it was broken:

| check | result |
|---|---|
| `npm run build` | ✓ 176 static pages |
| `tsc --noEmit` | ✓ clean |
| `npx vitest run` | ✓ 333 passing |
| Browser screenshots at 390 / 768 / 1440 | ✓ looked perfect |
| `<title>` and `rel="canonical"` | ✓ correct |

That last row is the cruel part. Metadata is produced by `generateMetadata` and survives the bailout, so the pages carried correct titles and canonical URLs pointing at freshly-built SEO slugs — while the body those tags described was never sent.

## Root cause

`PostHogProvider` calls `useSearchParams()` in `PostHogPageView`, and the root layout wrapped the whole tree in a single Suspense boundary:

```tsx
// src/app/layout.tsx — BEFORE
<body>
  <Suspense fallback={null}>
    <PostHogProvider>          {/* PostHogPageView() calls useSearchParams */}
      <AuthProvider>{children}</AuthProvider>   {/* ← the entire app */}
    </PostHogProvider>
  </Suspense>
</body>
```

On a **statically generated** page, `useSearchParams()` forces Next to bail its **closest Suspense boundary** out of server rendering — the search params aren't knowable at build time, so everything in that boundary is deferred to the client.

That boundary contained `{children}`. So the bail-out wasn't scoped to an analytics pixel; it covered every page in the application.

The two conditions have to coincide, which is why it is easy to miss:

1. A client component calling `useSearchParams()`, and
2. a Suspense boundary that also encloses real content, and
3. the route being statically generated.

Dynamic routes (`ƒ` in the build output) were unaffected — search params are known per-request there. Only the `●` prerendered routes lost their content, which is exactly the SEO-critical set: restaurant detail and list detail.

## The fix

Scope the boundary to the component that needs it, and never wrap children.

```tsx
// src/components/providers/PostHogProvider.tsx — AFTER
return (
  <PHProvider client={posthog}>
    {/* MUST have its own boundary. When it shared one with {children} the
        entire app rendered client-side. Do not hoist this to wrap children. */}
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
    {children}
  </PHProvider>
);
```

```tsx
// src/app/layout.tsx — AFTER
<body>
  <PostHogProvider>
    <AuthProvider>{children}</AuthProvider>
  </PostHogProvider>
</body>
```

### Second-order trap

Removing the outer Suspense immediately broke the build:

```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/"
Error occurred prerendering page "/"
Export encountered an error on /(app)/page: /, exiting the build.
```

The app shell's own `TopBar` used `useSearchParams()` to prefill the search input, and had been relying on the very boundary just deleted. Fixed by isolating the field rather than re-wrapping the bar — so only the input is client-rendered while the nav, the logo and every page below still render on the server:

```tsx
function SearchField() {           // uses useSearchParams
  const q = useSearchParams().get("q") ?? "";
  return <input key={q} defaultValue={q} className="tm-topbar-input" … />;
}

function SearchFieldFallback() {   // same box, no query — server-rendered
  return <input className="tm-topbar-input" … />;
}

<form className="tm-topbar-search" action="/search" role="search">
  <Suspense fallback={<SearchFieldFallback />}>
    <SearchField />
  </Suspense>
</form>
```

A `fallback={null}` here would have left the search box missing from the server HTML and caused layout shift on hydration. The fallback renders the same element without the query.

### Third change, same cause

`PitchBand` (the homepage hero, carrying the `<h1>` and the value proposition) returned `null` while auth resolved:

```tsx
if (loading || user) return null;   // BEFORE — server emits nothing
if (user) return null;              // AFTER  — server emits the hero
```

During SSR `loading` is always true, so the homepage had no `<h1>` for a separate reason. The trade is that a signed-in visitor sees the band for one frame; an empty homepage for crawlers is worse.

## Result

Measured on the same production URL, before and after:

| | before | after |
|---|---|---|
| `/restaurants/langer-s-…-159` | 26,589 bytes | **41,102 bytes** |
| `<h1>` count | 0 | 1 (`Langer's Delicatessen-Restaurant`) |
| rendered tag cloud | absent | present |
| `/lists/…-124` result rows in HTML | 0 | **38** |
| homepage `<h1>` + tagline | absent | present |

## Prevention

**Screenshots and passing tests cannot detect this.** A screenshot is taken after hydration, so server-rendered and client-rendered pages are pixel-identical. The whole test suite runs in `node` against modules, never against served HTML.

The check that catches it is one line:

```bash
curl -s "$URL" | grep -c '<h1'    # 0 means the page is client-rendered
```

Guard rails now in place:

1. **`scripts/audit-screens.mjs` asserts server-rendered content** — it fetches each route's raw HTML (no JS) and fails when a page returns no `<h1>` or falls under a byte floor.
2. **Never wrap `{children}` in a Suspense boundary** that also contains a `useSearchParams` consumer. Give the consumer its own boundary, as close to it as possible.
3. **Treat "metadata is correct" as no evidence** about the body. `generateMetadata` runs on the server regardless of a CSR bailout, so `<title>` and `rel=canonical` are correct on a page whose content never shipped.
4. **After any deploy that matters for SEO**, curl the page rather than opening it. This bug reached production and was only found by checking the live HTML after the merge.

## Why it took a deploy to find

Every local signal was green, and the local signals were the wrong ones. The bug had been latent through an entire redesign — nine screens, a tag ranking system, SEO slugs, `rel=canonical`, a sitemap — all of which were reasoning about source that never reached a crawler. The premise that the app was "~1,550 indexable pages" was true of the code and false of the output for the whole time.

See SOL-001 and SOL-004 for the same shape in a different guise: a real failure that `tsc` and `vitest` both certify as fine.
