import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * `getRestaurantDetail` ran twice for every restaurant page view.
 *
 * Next calls `generateMetadata` and the page component separately and both fetch
 * the same record:
 *
 *     page.tsx:26   const r = id ? await getRestaurantDetail(id) : null;   // generateMetadata
 *     page.tsx:101  const r = await getRestaurantDetail(id);               // the page
 *
 * That function issues FOUR Supabase queries (restaurant, tags, images, list
 * memberships), so the SEO-critical detail page paid eight round trips to render
 * one restaurant. It is now wrapped in React's `cache()`, which dedupes calls
 * within a single request.
 *
 * ## Why this is a structural assertion
 *
 * The first version of this file counted calls to a stubbed Supabase client and
 * expected the second call to add none. It failed against the fixed code, and the
 * fix was not the problem — **React's `cache()` does not memoize outside a render
 * context.** Probed directly to be sure:
 *
 *     const cached = cache(spy); await cached(1); await cached(1);
 *     -> expected "vi.fn()" to be called 1 times, but got 2 times
 *
 * The memoization is per-request and Next supplies that context; vitest running
 * in `node` with no React render never has one. So the runtime behaviour is
 * genuinely unobservable here, and a call-counting test could only ever be
 * misleading — either failing on correct code, or passing for the wrong reason.
 *
 * What IS checkable is that the dedupe is wired up at all, and that is what this
 * asserts. The dedupe itself is React's documented contract, not this repo's
 * logic. Flagged plainly rather than dressed up as a behavioural test.
 */

const API = resolve(__dirname, "api.ts");
const PAGE = resolve(__dirname, "../../app/(app)/restaurants/[slug]/page.tsx");

describe("restaurant detail request dedupe", () => {
  it("wraps getRestaurantDetail in React's per-request cache", () => {
    const src = readFileSync(API, "utf8");

    expect(src).toMatch(/import \{[^}]*\bcache\b[^}]*\} from "react"/);
    expect(src).toMatch(/export const getRestaurantDetail = cache\(/);
  });

  it("still has the two call sites that made the dedupe worth adding", () => {
    // If either disappears the dedupe stops earning its keep — and if a THIRD
    // appears, this is still the right shape. Pinned so the reason survives.
    const src = readFileSync(PAGE, "utf8");
    const calls = src.match(/getRestaurantDetail\(/g) ?? [];

    expect(calls.length).toBeGreaterThanOrEqual(2);
  });
});
