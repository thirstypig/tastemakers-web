import { describe, expect, it } from "vitest";
import { assignTagLevels, levelFor, levelForGap } from "./levels";

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

  it("levels by distance from the leader, not absolute count", () => {
    // The design doc's worked example.
    const out = assignTagLevels([
      t("Would Recommend", 9),
      t("Popular/Trendy", 9),
      t("Unique Dishes", 8),
      t("Good Flavor", 7),
      t("top chef", 6),
      t("Great Service", 4),
    ]);
    expect(out.map((x) => x.level)).toEqual([1, 1, 2, 3, 4, 5]);
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
    const out = assignTagLevels([{ name: "a", count: 3 }, { name: "b" }]);
    expect(out.map((x) => x.level)).toEqual([1, 4]);
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
    expect(levelFor(9, 9)).toBe(1);
    expect(levelFor(6, 9)).toBe(4);
    expect(levelFor(1, 9)).toBe(5);
  });
});
