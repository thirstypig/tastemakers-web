import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/api/tags/search` interpolated the raw query into its filter:
 *
 *     .ilike("name", `%${q}%`)
 *
 * so `%` and `_` from the user act as wildcards and the query widens itself. A
 * search for `%` matches every tag; `_` matches any single character.
 *
 * Not injection — supabase-js parameterises — but the filter no longer means what
 * the person typed, which is the same class of bug as a query that returns too
 * much (TODO-099).
 *
 * The notable part is that this repo **already solved this**. `features/search`
 * runs every term through `sanitizeSearchTerm` + `likePattern`, and
 * `features/search/query.test.ts` has 13 tests pinning "a query cannot widen its
 * own filter". This route simply never called them — the third instance this
 * session of a correct fix applied at one call site and not the others.
 *
 * These tests assert on the pattern handed to the driver, because that is where
 * the widening happens; asserting on returned rows would need a real database and
 * would pass for the wrong reasons against a stub.
 */

const ilike = vi.fn();
const chain: Record<string, unknown> = {};

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: () => ({ from: () => chain }),
}));

beforeEach(() => {
  vi.resetModules();
  ilike.mockReset();

  for (const m of ["select", "is", "order"]) {
    chain[m] = () => chain;
  }
  chain.ilike = (...args: unknown[]) => {
    ilike(...args);
    return chain;
  };
  chain.limit = async () => ({ data: [], error: null });
});

async function search(q: string) {
  const { GET } = await import("./route");
  return GET(new Request(`https://example.test/api/tags/search?q=${encodeURIComponent(q)}`));
}

/** The pattern actually handed to the driver. */
function patternUsed(): string | undefined {
  return ilike.mock.calls[0]?.[1] as string | undefined;
}

describe("/api/tags/search filter", () => {
  it("does not let a percent sign widen the filter", async () => {
    await search("%");

    // Either the query was rejected outright, or the % never reached the pattern.
    const pattern = patternUsed();
    if (pattern !== undefined) {
      expect(pattern).not.toContain("%");
    }
  });

  it("does not let an underscore act as a single-character wildcard", async () => {
    await search("piz_a");

    const pattern = patternUsed();
    expect(pattern).toBeDefined();
    expect(pattern).not.toContain("_");
  });

  it("still searches for an ordinary term", async () => {
    await search("pizza");

    expect(patternUsed()).toContain("pizza");
  });

  it("returns nothing rather than everything when the query sanitises to empty", async () => {
    const res = await search("%%%");

    expect(await res.json()).toEqual({ tags: [] });
    expect(ilike).not.toHaveBeenCalled();
  });
});
