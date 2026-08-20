import { describe, expect, it } from "vitest";
import { assignTagLevels, levelFor, levelForGap, levelForShare } from "./levels";

const t = (name: string, count: number) => ({ name, count });

describe("levelForGap", () => {
  it("maps the gap exactly as iOS does", () => {
    expect(levelForGap(0)).toBe(1);
    expect(levelForGap(1)).toBe(2);
    expect(levelForGap(2)).toBe(3);
    expect(levelForGap(3)).toBe(4);
    expect(levelForGap(4)).toBe(5);
    expect(levelForGap(99)).toBe(5);
  });

  it("treats a negative gap as the top level", () => {
    // iOS uses `< 1`, not `== 0`, so a count above the leader still lands L1.
    expect(levelForGap(-3)).toBe(1);
  });
});

describe("assignTagLevels", () => {
  it("sorts by count descending", () => {
    const out = assignTagLevels([t("c", 2), t("a", 9), t("b", 5)]);
    expect(out.map((x) => x.name)).toEqual(["a", "b", "c"]);
  });

  it("levels by share of the leader, not absolute count and not gap", () => {
    // Leader 9. Shares: 1.00 1.00 0.89 0.78 0.67 0.44
    // Thresholds .8/.6/.4/.2  →  L1  L1  L1  L2  L2  L3
    //
    // Under the old gap rule this was [1,1,2,3,4,5]. The difference is the
    // point: 8 votes against a leader of 9 is near-unanimous agreement, and
    // calling it L2 while 4 votes is L5 overstates how much separates them.
    const out = assignTagLevels([
      t("Would Recommend", 9),
      t("Popular/Trendy", 9),
      t("Unique Dishes", 8),
      t("Good Flavor", 7),
      t("top chef", 6),
      t("Great Service", 4),
    ]);
    expect(out.map((x) => x.level)).toEqual([1, 1, 1, 2, 2, 3]);
  });

  it("gives every tag L1 when all counts are equal", () => {
    // This is production today: the UNIQUE (restaurant_id, tag_id) constraint
    // caps every count at 1, so the leader gap is 0 for all of them.
    const out = assignTagLevels([t("a", 1), t("b", 1), t("c", 1)]);
    expect(out.map((x) => x.level)).toEqual([1, 1, 1]);
  });

  it("differs from the old absolute thresholds on a low-count restaurant", () => {
    // Old web rule: >=10 → L1, >=5 → L2, >=3 → L3, >=2 → L4, else L5.
    // A leader with 4 votes was L3 on web but is L1 on iOS.
    const out = assignTagLevels([t("leader", 4), t("second", 3)]);
    expect(out[0]!.level).toBe(1);
    expect(out[1]!.level).toBe(2);
  });

  it("handles a single tag", () => {
    expect(assignTagLevels([t("only", 7)]).map((x) => x.level)).toEqual([1]);
  });

  it("returns an empty array for no tags", () => {
    expect(assignTagLevels([])).toEqual([]);
  });

  it("treats a missing count as zero", () => {
    // 0/3 = 0 share, which is the bottom of the scale. Under the gap rule this
    // was L4, because a gap of 3 was as far as that scale reached at low counts.
    const out = assignTagLevels([{ name: "a", count: 3 }, { name: "b" }]);
    expect(out.map((x) => x.level)).toEqual([1, 5]);
  });

  it("does not mutate its input", () => {
    const input = [t("a", 1), t("b", 9)];
    const copy = JSON.parse(JSON.stringify(input));
    assignTagLevels(input);
    expect(input).toEqual(copy);
  });
});

describe("levelFor", () => {
  it("levels one count against a known leader", () => {
    expect(levelFor(9, 9)).toBe(1);   // 1.00
    expect(levelFor(6, 9)).toBe(2);   // 0.67 — was L4 under the gap rule
    expect(levelFor(1, 9)).toBe(5);   // 0.11
  });

  it("is share-based, so the same ratio levels the same at any magnitude", () => {
    // This is the property the gap rule could not have: the scale adjusts to
    // the volume of voting rather than assuming counts stay in single digits.
    expect(levelFor(3, 6)).toBe(levelFor(50, 100));
    expect(levelFor(3, 6)).toBe(levelFor(500, 1000));
  });
});

describe("levelForShare", () => {
  /**
   * Thirsty Pig's real top tags, 2026-08-20. The ramp is calibrated against
   * this rather than against invented numbers, because the whole reason this
   * function exists is that `levelForGap` degenerates on real magnitudes.
   */
  const REAL = [93, 88, 58, 58, 56, 45, 40, 26, 14, 13, 11, 10, 10, 8];

  it("spreads real personal-frequency data across all five levels", () => {
    const levels = new Set(REAL.map((c) => levelForShare(c, 93)));
    expect(levels, "a ramp that collapses is not a ramp").toEqual(new Set([1, 2, 3, 4, 5]));
  });

  it("is why levelForGap could not be reused here", () => {
    // The regression this function prevents: gap-from-leader puts the top tag
    // at L1 and *everything else* at L5 on this data.
    const gapLevels = new Set(REAL.map((c) => levelForGap(93 - c)));
    expect(gapLevels).toEqual(new Set([1, 5]));
  });

  it("puts the leader at L1 and never inverts", () => {
    expect(levelForShare(93, 93)).toBe(1);
    const levels = REAL.map((c) => levelForShare(c, 93));
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]!, "a less-used tag must never read stronger").toBeGreaterThanOrEqual(levels[i - 1]!);
    }
  });

  it("maps the quintile boundaries exactly", () => {
    expect(levelForShare(80, 100)).toBe(1);
    expect(levelForShare(79, 100)).toBe(2);
    expect(levelForShare(60, 100)).toBe(2);
    expect(levelForShare(59, 100)).toBe(3);
    expect(levelForShare(40, 100)).toBe(3);
    expect(levelForShare(39, 100)).toBe(4);
    expect(levelForShare(20, 100)).toBe(4);
    expect(levelForShare(19, 100)).toBe(5);
  });

  it("does not divide by zero when the leader has no uses", () => {
    expect(levelForShare(0, 0)).toBe(5);
  });
});
