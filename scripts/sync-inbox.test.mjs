import { describe, it, expect } from "vitest";
import { validate, byNewest, render, KIND_ORDER } from "./sync-inbox.mjs";

const c = (over = {}) => ({
  id: "C-001", doc: "PRD-001", kind: "question", status: "open",
  author: "james", created: "2026-07-20T10:00:00Z", body: "text", resolution: null,
  ...over,
});

/**
 * The documented session ritual is "act on change_requests first". That only works if
 * they render first — so the ordering is behaviour a caller depends on, not cosmetics.
 */
describe("KIND_ORDER", () => {
  it("puts change_request ahead of everything else", () => {
    expect(KIND_ORDER[0]).toBe("change_request");
  });

  it("covers exactly the three supported kinds", () => {
    expect([...KIND_ORDER].sort()).toEqual(["change_request", "note", "question"]);
  });
});

/**
 * One malformed row must not block the whole inbox — but it must not vanish silently
 * either, or the doc reads as complete when it isn't.
 */
describe("validate", () => {
  it("keeps well-formed comments", () => {
    const { kept, warnings } = validate([c(), c({ id: "C-002" })]);
    expect(kept).toHaveLength(2);
    expect(warnings).toHaveLength(0);
  });

  it("skips an unknown kind and says which id was dropped", () => {
    const { kept, warnings } = validate([c({ kind: "rant" })]);
    expect(kept).toHaveLength(0);
    expect(warnings[0]).toContain("C-001");
    expect(warnings[0]).toContain("rant");
  });

  it("skips an unknown status", () => {
    const { kept, warnings } = validate([c({ status: "maybe" })]);
    expect(kept).toHaveLength(0);
    expect(warnings[0]).toContain("maybe");
  });

  it("skips rows missing a required field", () => {
    const { kept, warnings } = validate([{ id: "C-9", status: "open" }]);
    expect(kept).toHaveLength(0);
    expect(warnings[0]).toMatch(/required field/);
  });

  it("keeps the good rows when one row is bad", () => {
    const { kept, warnings } = validate([c({ kind: "rant" }), c({ id: "C-002" })]);
    expect(kept.map((k) => k.id)).toEqual(["C-002"]);
    expect(warnings).toHaveLength(1);
  });

  it("identifies a malformed row by index when it has no id", () => {
    const { warnings } = validate([{ kind: "note" }]);
    expect(warnings[0]).toContain("index 0");
  });
});

describe("byNewest", () => {
  it("sorts newest first", () => {
    const out = [c({ id: "old", created: "2026-01-01T00:00:00Z" }),
                 c({ id: "new", created: "2026-07-01T00:00:00Z" })].sort(byNewest);
    expect(out[0].id).toBe("new");
  });

  it("puts undated comments last instead of throwing", () => {
    const out = [c({ id: "undated", created: undefined }),
                 c({ id: "dated", created: "2026-07-01T00:00:00Z" })].sort(byNewest);
    expect(out[0].id).toBe("dated");
    expect(out[1].id).toBe("undated");
  });

  it("treats two undated comments as equal rather than erroring", () => {
    expect(byNewest(c({ created: undefined }), c({ created: undefined }))).toBe(0);
  });
});

describe("render", () => {
  const comments = [
    c({ id: "C-q", kind: "question", created: "2026-07-01T00:00:00Z" }),
    c({ id: "C-cr", kind: "change_request", created: "2026-06-01T00:00:00Z" }),
    c({ id: "C-n", kind: "note", created: "2026-07-10T00:00:00Z" }),
    c({ id: "C-done", kind: "question", status: "resolved",
        resolution: { note: "fixed", link: "abc1234", resolved: "2026-07-02T00:00:00Z", by: "claude" } }),
  ];
  const out = render(comments, [], "2026-07-24T00:00:00Z");

  it("renders change requests above questions, even when older", () => {
    expect(out.indexOf("## Change requests")).toBeLessThan(out.indexOf("## Questions"));
  });

  it("renders notes last of the three kinds", () => {
    expect(out.indexOf("## Notes")).toBeGreaterThan(out.indexOf("## Questions"));
  });

  it("counts only unresolved comments in the headline", () => {
    expect(out).toContain("**3 unresolved**");
  });

  it("pluralises the summary line correctly", () => {
    expect(out).toContain("1 change request ·");   // not "1 change requests"
    expect(out).not.toContain("1 notes");
  });

  it("moves resolved comments out of the open groups and into their own section", () => {
    const openEnd = out.indexOf("## Recently resolved");
    expect(openEnd).toBeGreaterThan(-1);
    expect(out.slice(0, openEnd)).not.toContain("C-done");
    expect(out.slice(openEnd)).toContain("C-done");
  });

  it("shows the resolution note and link, which are what make a resolution verifiable", () => {
    expect(out).toContain("fixed");
    expect(out).toContain("abc1234");
  });

  it("emits frontmatter so the board indexes the generated file", () => {
    expect(out.startsWith("---\nid: DOC-012\ntype: inbox")).toBe(true);
  });

  it("marks itself generated so nobody hand-edits it", () => {
    expect(out).toContain("GENERATED — do not hand-edit");
  });

  it("surfaces skipped-row warnings in the doc, not just on stdout", () => {
    const withWarn = render([c()], ['C-9: unknown kind "rant" — skipped'], "2026-07-24T00:00:00Z");
    expect(withWarn).toContain("malformed");
    expect(withWarn).toContain("C-9");
  });

  it("renders an empty inbox without crashing", () => {
    const empty = render([], [], "2026-07-24T00:00:00Z");
    expect(empty).toContain("**0 unresolved**");
    expect(empty).toContain("_Nothing open._");
  });
});
