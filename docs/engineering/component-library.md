---
id: DOC-011
type: component-lib
status: draft
phase: null
owner: james
tags: [web, tagging]
links: [PRD-001, DOC-007]
updated: 2026-07-23
---

# Component library

Reusable React components in `tastemakers-web/src/components/`. **Web only** — iOS and
Android have their own view layers and are not covered here.

> **Note:** `tastemakers-web/CLAUDE.md` lists this directory as containing only
> `JsonLd.tsx`. That is stale — there are 9 components plus a utility module.

## Template — copy this row shape

| Component | Props | States | Used by | Notes |
|---|---|---|---|---|
| `Example` | `foo: string`, `bar?: number = 0` | default / loading / empty | where it's used | anything surprising |

---

## Tag components

The core visual vocabulary of the product. Colours are ported from iOS
`ColorExtension.swift` so web and iOS render vote weight identically.

| Component | Props | States | Used by | Notes |
|---|---|---|---|---|
| `TagChip` | `tag: Tag`, `showCount?: boolean = false` | 5 visual levels by vote count | `TagCloud` | Falls back to level 5 styling for an unknown level |
| `TagCloud` | `tags: Tag[]`, `showCount?: boolean = false`, `className?: string = ""` | renders `null` when empty | restaurant + list pages | Thin wrapper — maps to `TagChip` |
| `TagReview` | TODO | TODO | TODO | |
| `tag-utils.ts` | *(not a component)* | — | `TagChip` | Exports `voteCountToLevel()` and `TAG_LEVEL_STYLES` |

### The vote-count → level mapping

This is where the product's core signal becomes visible. From `tag-utils.ts`:

| Votes | Level | Appearance |
|---|---|---|
| ≥ 10 | 1 | `#3D296E` dark purple, weight 700, opacity 1.0 — most prominent |
| ≥ 5 | 2 | `#594094`, weight 600, opacity 1.0 |
| ≥ 3 | 3 | `#876DC4`, weight 500, opacity 0.9 |
| ≥ 2 | 4 | `#876DC4`, weight 400, opacity 0.75 |
| 1 | 5 | `#EFE8FE` pale, weight 400, opacity 0.55 — fades back |

**⚠️ Naming trap.** `level` means two different things:
- **Backend:** the raw vote count (`count(restaurant_tag.tag_id) AS level`) — unbounded.
- **Web:** a 1–5 tier derived from that count by `voteCountToLevel()`.

Same word, different type. See the glossary (DOC-004).

**`showCount` defaults to `false` and is never passed as `true` anywhere in the app.**
So the numeric vote count is never shown to a user — consensus is communicated purely
through colour and weight. That is a real product decision worth confirming: it means a
tag with 10 votes and one with 50 look identical.

## Layout & chrome

| Component | Props | States | Used by | Notes |
|---|---|---|---|---|
| `Nav` | none | authenticated / loading / signed-out | `(public)` layout | Uses `useAuth()`; falls back through username → first name → email prefix → "Account" |

## Analytics & consent

| Component | Props | States | Used by | Notes |
|---|---|---|---|---|
| `AdUnit` | `slot: string`, `minHeight?: number = 280` | pushed / not-yet-pushed | public content pages | Guarded by a `useRef` so AdSense isn't pushed twice on re-render. Gated by `ADS_ENABLED` in `src/lib/ads.ts` — currently `false`. |
| `Analytics` | TODO | TODO | root layout | GA4 |
| `PrivacySettings` | TODO | TODO | privacy page | Consent controls |

## Providers

| Component | Props | States | Used by | Notes |
|---|---|---|---|---|
| `AuthProvider` | `children` | — | root layout | Supabase session context |
| `PostHogProvider` | `children` | — | root layout | Requires `NEXT_PUBLIC_POSTHOG_KEY` |

---

## Shared CSS classes

Not components, but shared visual primitives in `globals.css`:

| Class | Purpose |
|---|---|
| `.pub-card` | Public-page card with CSS-only hover — no JS handler, so it works in Server Components |
| `.pub-nav-link` | Public nav link hover |
| `.tm-cursor`, `.tm-pulse` | Admin terminal-style affordances |

**Admin pages use `var(--tm-*)` CSS variables, never hardcoded hex.** The admin shell
has a light/dark toggle; hardcoded values ignore it. Semantic data-viz colours (chart
greens/reds) are exempt — they carry meaning independent of theme.

<!-- TODO(james): fill in TagReview, Analytics, PrivacySettings props and states.
     Left blank rather than guessed. -->
