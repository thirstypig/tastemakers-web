import { describe, it, expect } from "vitest";
import { cityLeaderboard, type CityEvent } from "./city-stats";

const NOW = new Date("2026-06-09T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86400000).toISOString();
const ev = (city: string | null, n: number): CityEvent => ({ city, createdAt: daysAgo(n) });

describe("cityLeaderboard", () => {
  it("scores current-window events and ranks desc", () => {
    const out = cityLeaderboard([ev("LA", 1), ev("LA", 5), ev("NY", 2)], NOW);
    expect(out[0]).toMatchObject({ city: "LA", current: 2 });
    expect(out[1]).toMatchObject({ city: "NY", current: 1 });
  });
  it("computes delta vs the prior 30-day window", () => {
    const out = cityLeaderboard([ev("LA", 1), ev("LA", 40), ev("LA", 45)], NOW);
    expect(out[0]).toMatchObject({ current: 1, previous: 2, delta: -1 });
  });
  it("excludes null/empty cities and trims whitespace", () => {
    const out = cityLeaderboard([ev(null, 1), ev("  ", 2), ev(" LA ", 3)], NOW);
    expect(out).toHaveLength(1);
    expect(out[0].city).toBe("LA");
  });
  it("ignores events older than 60 days and caps at `top`", () => {
    const events = ["A", "B", "C"].map((c) => ev(c, 1)).concat([ev("Z", 70)]);
    const out = cityLeaderboard(events, NOW, 30, 2);
    expect(out).toHaveLength(2);
    expect(out.find((s) => s.city === "Z")).toBeUndefined();
  });
});
