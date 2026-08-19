import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Every public page re-queried Supabase on every request: there was not one
 * `export const revalidate` in the whole `src/app` tree (TODO-094).
 *
 * These pages are read-only catalogue views over data that changes rarely —
 * production tagging is down 98.5% and the newest tag is from 2025 — so serving a
 * page regenerated at most once a minute is indistinguishable to a visitor and
 * removes almost all of the database load behind the SEO-indexed surface.
 *
 * ## Why this is a structural assertion
 *
 * `revalidate` is a module-level export that the Next BUILD reads; it has no
 * runtime behaviour a unit test can observe, exactly like the React.cache half of
 * this todo (see request-cache.test.ts, where a call-counting test failed against
 * correct code). Asserting the export is what can honestly be checked here — the
 * caching itself is Next's contract. `npm run build` is the real verification,
 * and it prints the rendering strategy per route.
 *
 * Deliberately NOT listed: /search, /bookmarks and /profile, which are
 * per-visitor and must stay dynamic; /privacy, /explore and /review, which are
 * already static and query nothing.
 */

const APP = resolve(__dirname, "../app");

/** Public, Supabase-backed, same for every visitor. */
const CACHED_PAGES = [
  "(app)/page.tsx",
  "(app)/restaurants/page.tsx",
  "(app)/restaurants/[slug]/page.tsx",
  "(app)/lists/page.tsx",
  "(app)/lists/[slug]/page.tsx",
  "(app)/cuisines/page.tsx",
  "(public)/tastemakers/page.tsx",
  "(public)/tastemakers/[slug]/page.tsx",
];

/** Per-visitor: caching these would serve one person's view to everyone. */
const MUST_STAY_DYNAMIC = [
  "(app)/bookmarks/page.tsx",
  "(app)/profile/page.tsx",
  "(app)/search/page.tsx",
];

describe("public page revalidation", () => {
  it.each(CACHED_PAGES)("%s declares a revalidate window", (rel) => {
    const src = readFileSync(resolve(APP, rel), "utf8");

    const match = src.match(/export const revalidate\s*=\s*(\d+)/);
    expect(match, `${rel} has no revalidate export`).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThan(0);
  });

  it.each(MUST_STAY_DYNAMIC)("%s does NOT declare revalidate", (rel) => {
    const path = resolve(APP, rel);
    if (!existsSync(path)) return; // page may not exist; nothing to assert

    const src = readFileSync(path, "utf8");
    expect(
      src,
      `${rel} is per-visitor — caching it would serve one person's view to everyone`,
    ).not.toMatch(/export const revalidate/);
  });
});
