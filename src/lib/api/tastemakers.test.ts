import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `listTastemakers` and `getTastemaker` counted a tastemaker's tags by reading
 * every matching `restaurant_tag` row and taking `.length`. Neither read was
 * paged, and PostgREST caps responses at 1,000 rows with no error.
 *
 * Caught in the browser on 2026-08-19, not by a test: /tastemakers showed
 * Thirsty Pig 871 tags and Master Taster 129 — summing to exactly 1000 — while
 * Thirsty Pig's own profile showed 932. The listing had lost 61 rows off the
 * end of the cap, and the only visible symptom was that the per-user counts
 * added up to precisely the cap.
 *
 * `fetchAllPages` already existed in `src/lib/api/shared.ts` and already fixed
 * this exact defect in `features/restaurants` and `features/cuisines`. It had
 * simply not been applied here — the half-applied shape this codebase keeps
 * producing.
 *
 * The fake below enforces the cap the way PostgREST does: an unranged read
 * returns the first 1,000 rows and reports no error. A test that did not model
 * the cap would pass against the broken code.
 */

const CAP = 1000;

const USERS = [
  { id: 1, first_name: "Thirsty", last_name: "Pig", username: "Thirstypig", short_description: "", instagram: null, image: null },
  { id: 2, first_name: "Master", last_name: "Taster", username: "Taster2684", short_description: "", instagram: null, image: null },
];

/**
 * User 1 owns 1,200 tag rows and user 2 owns 300. The combined read is 1,500
 * rows, so an unpaged read sees user 1's first 1,000 and none of user 2's —
 * the same shape as the production numbers that surfaced this.
 */
const TAG_ROWS = [
  ...Array.from({ length: 1200 }, () => ({ user_id: 1 })),
  ...Array.from({ length: 300 }, () => ({ user_id: 2 })),
];

const from = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createServerClient: () => ({ from }),
}));

vi.mock("./shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared")>();
  return { ...actual, coverImage: () => "https://example.test/img.jpg" };
});

/**
 * A chainable stand-in for the supabase query builder.
 *
 * Every filter method returns the same object so calls can be chained in any
 * order, `.range()` slices, and awaiting without `.range()` truncates at the
 * cap — which is precisely the behaviour that made the bug invisible.
 */
function builderFor(rows: unknown[]) {
  const chain: Record<string, unknown> = {
    data: rows.slice(0, CAP),
    error: null,
  };

  for (const method of ["select", "eq", "is", "in", "order", "limit"]) {
    chain[method] = () => chain;
  }

  chain.range = (lo: number, hi: number) => ({
    data: rows.slice(lo, Math.min(hi + 1, lo + CAP)),
    error: null,
  });

  chain.single = () => ({ data: rows[0] ?? null, error: null });

  chain.then = (resolve: (v: unknown) => unknown) =>
    resolve({ data: rows.slice(0, CAP), error: null });

  return chain;
}

function tableFor(name: string, userFilter?: number) {
  if (name === "users") return builderFor(userFilter ? USERS.filter((u) => u.id === userFilter) : USERS);
  if (name === "restaurant_tag") {
    return builderFor(userFilter ? TAG_ROWS.filter((r) => r.user_id === userFilter) : TAG_ROWS);
  }
  // testmaker_list / testmaker_list_restaurant — not what these tests exercise.
  return builderFor([]);
}

describe("listTastemakers", () => {
  beforeEach(() => {
    vi.resetModules();
    from.mockReset();
    from.mockImplementation((name: string) => tableFor(name));
  });

  it("counts tags beyond PostgREST's row cap", async () => {
    const { listTastemakers } = await import("./index");
    const tastemakers = await listTastemakers();

    const thirstyPig = tastemakers.find((t) => t.username === "Thirstypig");

    expect(thirstyPig!.followerCount).toBe(1200);
  });

  it("does not lose a tastemaker whose rows sit entirely past the cap", async () => {
    const { listTastemakers } = await import("./index");
    const tastemakers = await listTastemakers();

    const masterTaster = tastemakers.find((t) => t.username === "Taster2684");

    // Against the unpaged read this was 0: all 300 rows sat past row 1,000.
    expect(masterTaster!.followerCount).toBe(300);
  });

  it("never lets the per-user counts sum to exactly the cap", async () => {
    // The production tell. If the totals land on 1000 the read was truncated,
    // whatever the individual numbers look like.
    const { listTastemakers } = await import("./index");
    const tastemakers = await listTastemakers();

    const total = tastemakers.reduce((sum, t) => sum + t.followerCount, 0);

    expect(total).toBe(1500);
    expect(total).not.toBe(CAP);
  });
});

describe("getTastemaker", () => {
  beforeEach(() => {
    vi.resetModules();
    from.mockReset();
  });

  it("counts a single tastemaker's tags past the cap", async () => {
    // One user fits under the cap in production today (932 of 1,000), so this
    // asserts the read is paged rather than merely small enough to survive.
    from.mockImplementation((name: string) => tableFor(name, 1));

    const { getTastemaker } = await import("./index");
    const tastemaker = await getTastemaker("Thirstypig");

    expect(tastemaker!.followerCount).toBe(1200);
  });
});

/**
 * `.eq("username", slug)` is case-sensitive, so `/tastemakers/thirstypig`
 * returned 404 while `/tastemakers/Thirstypig` rendered. Verified live before
 * the fix. Our own links carry the stored casing, so this only ever broke
 * inbound links — the traffic these SEO pages exist to capture.
 */
describe("getTastemaker — slug casing", () => {
  /** Mimics a case-sensitive `.eq("username", ...)`: an exact match or nothing. */
  function caseSensitiveUsers() {
    return (name: string, requested?: string) => {
      if (name !== "users") return builderFor(name === "restaurant_tag" ? TAG_ROWS : []);

      const chain: Record<string, unknown> = {};
      let matched = USERS;

      for (const method of ["select", "is", "in", "order", "limit"]) {
        chain[method] = () => chain;
      }
      chain.eq = (column: string, value: unknown) => {
        if (column === "username") matched = USERS.filter((u) => u.username === value);
        if (column === "id") matched = USERS.filter((u) => u.id === value);
        return chain;
      };
      chain.single = () => ({ data: matched[0] ?? null, error: null });
      chain.range = (lo: number, hi: number) => ({ data: matched.slice(lo, hi + 1), error: null });
      chain.then = (resolve: (v: unknown) => unknown) => resolve({ data: matched, error: null });
      void requested;
      return chain;
    };
  }

  beforeEach(() => {
    vi.resetModules();
    from.mockReset();
    from.mockImplementation(caseSensitiveUsers());
  });

  it("resolves the stored casing", async () => {
    const { getTastemaker } = await import("./index");
    expect((await getTastemaker("Thirstypig"))!.name).toBe("Thirsty Pig");
  });

  it("resolves a lowercased slug", async () => {
    const { getTastemaker } = await import("./index");
    const tastemaker = await getTastemaker("thirstypig");

    expect(tastemaker, "a lowercased profile URL must not 404").toBeTruthy();
    expect(tastemaker!.name).toBe("Thirsty Pig");
  });

  it("resolves an arbitrarily cased slug", async () => {
    const { getTastemaker } = await import("./index");
    expect((await getTastemaker("THIRSTYPIG"))!.name).toBe("Thirsty Pig");
  });

  it("reports the canonical casing so the page can redirect to it", async () => {
    const { getTastemaker } = await import("./index");
    // The page compares `slug !== tastemaker.slug` to decide on a 308, so the
    // returned slug must be the stored spelling, never the requested one.
    expect((await getTastemaker("thirstypig"))!.slug).toBe("Thirstypig");
  });

  it("still 404s a genuinely unknown slug", async () => {
    const { getTastemaker } = await import("./index");
    expect(await getTastemaker("nobody")).toBeNull();
  });
});
