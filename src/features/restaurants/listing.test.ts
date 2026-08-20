import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `listRestaurants` read the tag rows for its top-60 with `.in(...)` but no
 * range. The `.in(...)` bounds it, so this was never the unbounded read of
 * todo 090 — but the bound is data-dependent, not structural.
 *
 * Measured against production 2026-08-19: **848 rows against the 1,000 cap**,
 * 15% headroom, matching the 848 todo 122 recorded. The top 60 are by
 * definition the restaurants people tag most, so density lands here first —
 * any re-engagement, or the tag-seeding backfill (backend todos 033-035),
 * crosses the threshold.
 *
 * The failure is invisible in the way todo 090's was: the page renders, the tag
 * clouds are simply missing rows, and nothing is raised.
 *
 * The fake models PostgREST truthfully — an unranged read returns the first
 * 1,000 rows and reports **success** — so a test that skipped that would pass
 * against the broken code.
 */

const CAP = 1000;

const RESTAURANTS = [
  { id: 1, place_id: "p1", name: "Heavily Tagged", address: "1 Main St, Los Angeles, CA", lat: "34", lng: "-118" },
  { id: 2, place_id: "p2", name: "Past The Cap", address: "2 Main St, Los Angeles, CA", lat: "34", lng: "-118" },
];

/**
 * Restaurant 1 owns 1,200 rows and restaurant 2 owns 50, so restaurant 2's rows
 * begin at index 1,200 — past the cap. An unpaged read sees none of them and
 * renders restaurant 2 with no tags at all.
 */
const TAG_ROWS = [
  ...Array.from({ length: 1200 }, () => ({ restaurant_id: 1, tag_id: 100 })),
  ...Array.from({ length: 50 }, () => ({ restaurant_id: 2, tag_id: 200 })),
];

const TAGS = [
  { id: 100, name: "Popular/Trendy" },
  { id: 200, name: "Hidden Gem" },
];

const from = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: () => ({ from }),
}));

/** Chainable stand-in: `.range()` slices, awaiting without it truncates at the cap. */
function builderFor(rows: unknown[]) {
  const chain: Record<string, unknown> = { data: rows.slice(0, CAP), error: null };

  for (const method of ["select", "eq", "is", "in", "order", "limit"]) {
    chain[method] = () => chain;
  }
  chain.range = (lo: number, hi: number) => ({
    data: rows.slice(lo, Math.min(hi + 1, lo + CAP)),
    error: null,
  });
  chain.then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: rows.slice(0, CAP), error: null });

  return chain;
}

describe("listRestaurants", () => {
  beforeEach(() => {
    vi.resetModules();
    from.mockReset();
    from.mockImplementation((name: string) => {
      if (name === "restaurants") return builderFor(RESTAURANTS);
      if (name === "restaurant_tag") return builderFor(TAG_ROWS);
      if (name === "tags") return builderFor(TAGS);
      return builderFor([]);
    });
  });

  it("gives tags to a restaurant whose rows sit past the row cap", async () => {
    const { listRestaurants } = await import("./api");
    const restaurants = await listRestaurants();

    const pastTheCap = restaurants.find((r) => r.name === "Past The Cap");

    expect(pastTheCap, "the restaurant itself must still be listed").toBeTruthy();
    // Against the unpaged read this was [] — the card rendered with an empty
    // tag row and nothing indicated the rows had been dropped.
    expect(pastTheCap!.tags.length, "its tags must survive the cap").toBeGreaterThan(0);
    expect(pastTheCap!.tags[0].name).toBe("Hidden Gem");
  });

  it("still tags the restaurant whose rows fall inside the cap", async () => {
    // The control. This one was never broken, which is what made the defect
    // hard to see: most cards looked right.
    const { listRestaurants } = await import("./api");
    const restaurants = await listRestaurants();

    const heavy = restaurants.find((r) => r.name === "Heavily Tagged");

    expect(heavy!.tags[0].name).toBe("Popular/Trendy");
  });

  it("ranks by the full tag table, not the first page of it", async () => {
    const { listRestaurants } = await import("./api");
    const restaurants = await listRestaurants();

    // 1,200 rows beats 50, and both counts have to be complete for the order
    // to be trustworthy (todo 090).
    expect(restaurants.map((r) => r.name)).toEqual(["Heavily Tagged", "Past The Cap"]);
  });
});
