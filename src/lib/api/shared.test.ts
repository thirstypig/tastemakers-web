import { describe, expect, it } from "vitest";
import { buildTagsByRestaurant, cityFromAddress, toRestaurant } from "./shared";

/** restaurant_tag holds one row per user per tag; duplicates are the votes. */
function rows(spec: Array<[restaurant: number, tag: number, votes: number]>) {
  return spec.flatMap(([restaurant_id, tag_id, votes]) =>
    Array.from({ length: votes }, () => ({ restaurant_id, tag_id })),
  );
}

const NAMES = new Map([
  [1, "Would Recommend"],
  [2, "Great Service"],
  [3, "Long Wait"],
  [4, "Cash Only"],
  [5, "Tiny Room"],
  [6, "Authentic"],
]);

describe("buildTagsByRestaurant", () => {
  it("sorts a restaurant's tags by vote count, strongest first", () => {
    const out = buildTagsByRestaurant(rows([[10, 3, 2], [10, 1, 9], [10, 2, 5]]), NAMES);
    expect(out.get(10)!.map((t) => t.name)).toEqual([
      "Would Recommend",
      "Great Service",
      "Long Wait",
    ]);
  });

  it("levels each tag against ITS OWN restaurant's leader, not a global maximum", () => {
    // The regression this guards: restaurant 20's top tag has 3 votes, which is
    // far below restaurant 10's leader on 9. If levelling ever reverts to a
    // global top count, every tag on 20 collapses to L5 and the quieter
    // restaurant looks like it has no strong tags at all.
    const out = buildTagsByRestaurant(
      rows([
        [10, 1, 9], [10, 2, 8],
        [20, 3, 3], [20, 4, 2],
      ]),
      NAMES,
    );

    expect(out.get(10)!.map((t) => t.level)).toEqual([1, 2]);
    expect(out.get(20)!.map((t) => t.level)).toEqual([1, 2]);
  });

  it("assigns levels by gap from the leader, matching iOS", () => {
    const out = buildTagsByRestaurant(
      rows([[10, 1, 9], [10, 2, 8], [10, 3, 7], [10, 4, 6], [10, 5, 5], [10, 6, 1]]),
      NAMES,
    );
    // gaps 0,1,2,3,4,8 → L1,L2,L3,L4,L5,L5
    expect(out.get(10)!.map((t) => t.level)).toEqual([1, 2, 3, 4, 5, 5]);
  });

  it("gives every tag L1 when all counts tie", () => {
    // Production today: UNIQUE (restaurant_id, tag_id) caps every count at 1.
    const out = buildTagsByRestaurant(rows([[10, 1, 1], [10, 2, 1], [10, 3, 1]]), NAMES);
    expect(out.get(10)!.map((t) => t.level)).toEqual([1, 1, 1]);
  });

  it("caps how many tags each restaurant returns", () => {
    const out = buildTagsByRestaurant(
      rows([[10, 1, 6], [10, 2, 5], [10, 3, 4], [10, 4, 3]]),
      NAMES,
      2,
    );
    expect(out.get(10)).toHaveLength(2);
  });

  it("keeps the strongest tags when capping, not an arbitrary two", () => {
    const out = buildTagsByRestaurant(
      rows([[10, 3, 1], [10, 1, 9], [10, 2, 5]]),
      NAMES,
      2,
    );
    expect(out.get(10)!.map((t) => t.name)).toEqual(["Would Recommend", "Great Service"]);
  });

  it("drops tags with no name rather than rendering a blank chip", () => {
    // A soft-deleted tag is excluded from the names lookup.
    const out = buildTagsByRestaurant(rows([[10, 1, 5], [10, 99, 9]]), NAMES);
    expect(out.get(10)!.map((t) => t.name)).toEqual(["Would Recommend"]);
  });

  it("carries the vote count through", () => {
    const out = buildTagsByRestaurant(rows([[10, 1, 4]]), NAMES);
    expect(out.get(10)![0]!.count).toBe(4);
  });

  it("returns an empty map for no rows", () => {
    expect(buildTagsByRestaurant([], NAMES).size).toBe(0);
  });
});

describe("cityFromAddress", () => {
  it("reads the city from a full US address", () => {
    expect(cityFromAddress("704 S Alvarado St, Los Angeles, CA 90057, United States")).toBe(
      "Los Angeles",
    );
  });

  it("handles a street line containing its own commas-free parenthetical", () => {
    expect(
      cityFromAddress("704 S Alvarado St (at 7th St), Los Angeles, CA 90057, United States"),
    ).toBe("Los Angeles");
  });

  it("survives the 'Miles away |' prefix some production rows carry", () => {
    // Real shape seen on the home feed.
    expect(
      cityFromAddress("2.2 Miles away | 3332 E Olympic Blvd, Los Angeles, CA 90023, United States"),
    ).toBe("Los Angeles");
  });

  it("falls back to the second-to-last part on a three-part address", () => {
    expect(cityFromAddress("Sūrat, Gujarāt, India")).toBe("Sūrat");
  });

  it("handles a two-part address", () => {
    expect(cityFromAddress("Brooklyn, NY")).toBe("Brooklyn");
  });

  it("returns empty for null, empty, or a single segment", () => {
    expect(cityFromAddress(null)).toBe("");
    expect(cityFromAddress("")).toBe("");
    expect(cityFromAddress("Somewhere")).toBe("");
  });

  it("trims surrounding whitespace off the segment", () => {
    expect(cityFromAddress("1 Main St,   Austin  , TX 78701, USA")).toBe("Austin");
  });
});

describe("toRestaurant", () => {
  it("builds a name-plus-id slug rather than a bare id", () => {
    const r = toRestaurant({ id: 182, name: "In-N-Out Burger", address: "1 A St, Arcadia, CA, USA" }, []);
    expect(r.slug).toBe("in-n-out-burger-182");
  });

  it("takes cuisine from the strongest tag, defaulting when there are none", () => {
    expect(toRestaurant({ id: 1, name: "X" }, []).cuisine).toBe("Restaurant");
    expect(
      toRestaurant({ id: 1, name: "X" }, [{ id: "9", name: "Ramen", level: 1, count: 3 }]).cuisine,
    ).toBe("Ramen");
  });

  it("leaves coordinates undefined rather than NaN when absent", () => {
    const r = toRestaurant({ id: 1, name: "X" }, []);
    expect(r.latitude).toBeUndefined();
    expect(r.longitude).toBeUndefined();
  });
});
