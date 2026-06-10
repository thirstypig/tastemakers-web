import { describe, it, expect } from "vitest";
import { bucketByWeek } from "./trends";

const NOW = new Date("2026-06-09T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();

describe("bucketByWeek", () => {
  it("returns `weeks` zero-filled buckets for empty input", () => {
    expect(bucketByWeek([], 12, NOW)).toEqual(new Array(12).fill(0));
  });
  it("puts a date from the last 7 days in the final bucket", () => {
    const b = bucketByWeek([daysAgo(2)], 12, NOW);
    expect(b[11]).toBe(1);
    expect(b.reduce((a, x) => a + x, 0)).toBe(1);
  });
  it("puts a date 8 days ago in the second-to-last bucket", () => {
    expect(bucketByWeek([daysAgo(8)], 12, NOW)[10]).toBe(1);
  });
  it("ignores dates older than the window, in the future, or invalid", () => {
    const b = bucketByWeek([daysAgo(85), daysAgo(-1), "not-a-date"], 12, NOW);
    expect(b.reduce((a, x) => a + x, 0)).toBe(0);
  });
  it("counts multiple dates in the same bucket", () => {
    expect(bucketByWeek([daysAgo(1), daysAgo(3), daysAgo(6)], 12, NOW)[11]).toBe(3);
  });
});
