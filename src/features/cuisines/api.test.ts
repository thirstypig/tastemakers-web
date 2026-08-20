import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `listCuisines` read `category_restaurant` with no range and no limit, then
 * aggregated in JS to derive `placeCount` per cuisine — and sorted by it.
 *
 * PostgREST caps responses at 1,000 rows regardless of what the client asks for.
 * `category_restaurant` holds 1,572 rows in production (counted 2026-08-18), so
 * 36% of the join table never reached the aggregation. Both the counts and the
 * ordering on /cuisines were wrong, and nothing surfaced it: the page rendered
 * normally with plausible-looking numbers.
 *
 * This is the same defect `fetchAllPages` was written for and already fixes in
 * `features/restaurants/api.ts` — it simply was not applied here.
 *
 * The fake below enforces the cap the way PostgREST does: an unranged read
 * returns the first 1,000 rows and reports no error, so a test that does not
 * model the cap would pass against the broken code.
 */

const CAP = 1000;

/** Cuisine 1's restaurants sit beyond row 1,000 — invisible to a capped read. */
const CATEGORIES = [
  { id: 1, title: "Late-night" },
  { id: 2, title: "Bakery" },
];

const LINKS = [
  // 1,200 filler rows for cuisine 2, enough to push cuisine 1 past the cap.
  ...Array.from({ length: 1200 }, (_, i) => ({ category_id: 2, restaurant_id: 10_000 + i })),
  // 5 distinct restaurants for cuisine 1, all past row 1,000.
  ...Array.from({ length: 5 }, (_, i) => ({ category_id: 1, restaurant_id: 20_000 + i })),
];

const from = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: () => ({ from }),
}));

vi.mock("@/lib/api/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/shared")>();
  return { ...actual, coverImage: () => "https://example.test/img.jpg" };
});

/** Mimics PostgREST: honours .range(), and silently truncates when not given one. */
function tableFor(name: string) {
  const rows = name === "categories" ? CATEGORIES : LINKS;

  const chain: Record<string, unknown> = {
    data: rows.slice(0, CAP),
    error: null,
    range: (lo: number, hi: number) => ({
      data: rows.slice(lo, Math.min(hi + 1, lo + CAP)),
      error: null,
    }),
    // make the un-ranged form awaitable, as the supabase client is
    then: (resolve: (v: unknown) => unknown) => resolve({ data: rows.slice(0, CAP), error: null }),
  };

  // `.order()` returns the builder so it can precede `.range()`. Paged reads
  // must impose a stable sort (todo 127) — without modelling it here, the fake
  // would reject the correct call shape.
  chain.order = () => chain;

  return { select: () => chain };
}

describe("listCuisines", () => {
  beforeEach(() => {
    vi.resetModules();
    from.mockReset();
    from.mockImplementation((name: string) => tableFor(name));
  });

  it("counts restaurants beyond PostgREST's row cap", async () => {
    const { listCuisines } = await import("./api");
    const cuisines = await listCuisines();

    const lateNight = cuisines.find((c) => c.name === "Late-night");

    expect(lateNight, "a cuisine whose links sit past row 1000 must still appear").toBeTruthy();
    expect(lateNight!.placeCount).toBe(5);
  });

  it("counts the full join table, not the first page of it", async () => {
    const { listCuisines } = await import("./api");
    const cuisines = await listCuisines();

    const bakery = cuisines.find((c) => c.name === "Bakery");

    expect(bakery!.placeCount).toBe(1200);
  });

  it("reads every category, not just the first page", async () => {
    // `categories` holds 374 rows today, comfortably under the cap — so this
    // would pass against an unpaged read and prove nothing. Pushing it over the
    // cap is the only way to assert the read is actually paged, and it is the
    // same defect waiting to happen as the table grows.
    const many = Array.from({ length: 1400 }, (_, i) => ({ id: i + 1, title: `Cuisine ${i + 1}` }));
    const links = many.map((c) => ({ category_id: c.id, restaurant_id: 90_000 + c.id }));

    from.mockImplementation((name: string) => {
      const rows = name === "categories" ? many : links;
      const chain: Record<string, unknown> = {
        data: rows.slice(0, CAP),
        error: null,
        range: (lo: number, hi: number) => ({
          data: rows.slice(lo, Math.min(hi + 1, lo + CAP)),
          error: null,
        }),
        then: (resolve: (v: unknown) => unknown) =>
          resolve({ data: rows.slice(0, CAP), error: null }),
      };
      chain.order = () => chain;
      return { select: () => chain };
    });

    const { listCuisines } = await import("./api");
    const cuisines = await listCuisines(2000);

    expect(cuisines).toHaveLength(1400);
  });
});
