import { describe, it, expect } from "vitest";
import {
  filterTodos,
  summarizeRoadmap,
  type TodoItem,
  type PlatformRoadmap,
} from "./admin-filters";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const items: TodoItem[] = [
  { id: "b1", platform: "backend", phase: "P1", status: "open", title: "Fix FCM key", detail: "", date: "" },
  { id: "b2", platform: "backend", phase: "P2", status: "in_progress", title: "Rate limiting", detail: "", date: "" },
  { id: "b3", platform: "backend", phase: "P2", status: "done", title: "Remove debug routes", detail: "", date: "" },
  { id: "i1", platform: "ios", phase: "P1", status: "open", title: "Update API URL", detail: "", date: "" },
  { id: "i2", platform: "ios", phase: "P2", status: "open", title: "Keychain migration", detail: "", date: "" },
  { id: "w1", platform: "web", phase: "P2", status: "open", title: "Profile page", detail: "", date: "" },
  { id: "a1", platform: "android", phase: "P1", status: "open", title: "Fix Hilt", detail: "", date: "" },
];

const platforms: PlatformRoadmap[] = [
  {
    platform: "backend",
    label: "Backend",
    milestones: [
      { title: "Fix Apple JWT", phase: "P1", status: "open", date: "" },
      { title: "Remove debug routes", phase: "P1", status: "done", date: "" },
      { title: "Rate limiting", phase: "P2", status: "in_progress", date: "" },
    ],
  },
  {
    platform: "ios",
    label: "iOS",
    milestones: [
      { title: "Update API URL", phase: "P1", status: "open", date: "" },
      { title: "Keychain", phase: "P2", status: "done", date: "" },
    ],
  },
];

// ── filterTodos ────────────────────────────────────────────────────────────────

describe("filterTodos", () => {
  it("returns all items when all three filters are 'all'", () => {
    const result = filterTodos(items, "all", "all", "all");
    expect(result).toHaveLength(items.length);
  });

  it("filters by platform — only returns that platform's items", () => {
    const result = filterTodos(items, "ios", "all", "all");
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.platform === "ios")).toBe(true);
  });

  it("filters by phase — only P1 items", () => {
    const result = filterTodos(items, "all", "P1", "all");
    expect(result).toHaveLength(3); // b1, i1, a1
    expect(result.every((i) => i.phase === "P1")).toBe(true);
  });

  it("filters by status — open items only", () => {
    const result = filterTodos(items, "all", "all", "open");
    expect(result.every((i) => i.status === "open")).toBe(true);
    // in_progress and done items must be excluded
    expect(result.some((i) => i.status === "in_progress")).toBe(false);
    expect(result.some((i) => i.status === "done")).toBe(false);
  });

  it("in_progress items are visible only under 'all' status filter", () => {
    // Regression: 'in_progress' items disappearing from the default 'open' filter
    const openFilter = filterTodos(items, "all", "all", "open");
    const allFilter = filterTodos(items, "all", "all", "all");
    const inProgressItem = items.find((i) => i.status === "in_progress")!;
    expect(openFilter.map((i) => i.id)).not.toContain(inProgressItem.id);
    expect(allFilter.map((i) => i.id)).toContain(inProgressItem.id);
  });

  it("combines platform + phase filters with AND logic — not OR", () => {
    // Regression: using || instead of && would return all backend OR all P1 items
    const result = filterTodos(items, "backend", "P1", "all");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b1");
  });

  it("combines all three filters", () => {
    const result = filterTodos(items, "backend", "P2", "done");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b3");
  });

  it("returns empty array when no items match", () => {
    // 'marketing' platform has no entries in the fixture
    const result = filterTodos(items, "marketing", "all", "all");
    expect(result).toHaveLength(0);
  });
});

// ── summarizeRoadmap ──────────────────────────────────────────────────────────

describe("summarizeRoadmap", () => {
  it("counts all milestones as total", () => {
    const { total } = summarizeRoadmap(platforms);
    expect(total).toBe(5);
  });

  it("counts done milestones correctly", () => {
    const { done } = summarizeRoadmap(platforms);
    expect(done).toBe(2); // backend done + ios keychain done
  });

  it("open = total - done (includes in_progress)", () => {
    // 'in_progress' items are not 'done' — they count as open
    const { open } = summarizeRoadmap(platforms);
    expect(open).toBe(3);
  });

  it("p1Open excludes done P1 milestones — only open/in-progress P1s", () => {
    // Regression: including done P1s would inflate the critical counter
    const { p1Open } = summarizeRoadmap(platforms);
    // "Fix Apple JWT" (P1, open) + "Update API URL" (P1, open) = 2
    // "Remove debug routes" (P1, done) must NOT count
    expect(p1Open).toBe(2);
  });

  it("returns all-zero summary for empty platforms", () => {
    const { total, open, done, p1Open } = summarizeRoadmap([]);
    expect(total).toBe(0);
    expect(open).toBe(0);
    expect(done).toBe(0);
    expect(p1Open).toBe(0);
  });
});
