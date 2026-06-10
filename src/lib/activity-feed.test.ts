import { describe, it, expect } from "vitest";
import { mergeFeed, type FeedItem } from "./activity-feed";

const item = (type: FeedItem["type"], createdAt: string, label = "x"): FeedItem =>
  ({ type, label, createdAt });

describe("mergeFeed", () => {
  it("sorts descending by createdAt across types", () => {
    const out = mergeFeed([
      item("signup", "2026-06-01T00:00:00Z"),
      item("list", "2026-06-03T00:00:00Z"),
      item("tag", "2026-06-02T00:00:00Z"),
    ]);
    expect(out.map((i) => i.type)).toEqual(["list", "tag", "signup"]);
  });
  it("limits output", () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      item("signup", `2026-05-${String(i + 1).padStart(2, "0")}T00:00:00Z`));
    expect(mergeFeed(items, 10)).toHaveLength(10);
  });
  it("drops items with invalid dates", () => {
    expect(mergeFeed([item("signup", "garbage"), item("tag", "2026-06-01T00:00:00Z")]))
      .toHaveLength(1);
  });
});
