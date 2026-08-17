import { describe, expect, it } from "vitest";
import {
  POPULAR_TAG_POOL,
  TAG_MAX_LENGTH,
  findExistingTag,
  normalizeTag,
  validateNewTag,
} from "./vocabulary";

describe("normalizeTag", () => {
  it("lowercases", () => {
    expect(normalizeTag("Great Service")).toBe("great service");
  });

  it("trims and collapses runs of whitespace", () => {
    expect(normalizeTag("  Great   Service ")).toBe("great service");
  });

  it("treats tabs and newlines as whitespace", () => {
    expect(normalizeTag("Great\tService\n")).toBe("great service");
  });
});

describe("validateNewTag", () => {
  it("rejects an empty tag", () => {
    expect(validateNewTag("", [])).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects a whitespace-only tag", () => {
    expect(validateNewTag("   ", [])).toEqual({ ok: false, reason: "empty" });
  });

  it(`accepts a tag of exactly ${TAG_MAX_LENGTH} characters`, () => {
    const exact = "a".repeat(TAG_MAX_LENGTH);
    expect(validateNewTag(exact, [])).toEqual({ ok: true, kind: "new", tag: exact });
  });

  it(`rejects a tag of ${TAG_MAX_LENGTH + 1} characters`, () => {
    expect(validateNewTag("a".repeat(TAG_MAX_LENGTH + 1), [])).toEqual({
      ok: false,
      reason: "too-long",
    });
  });

  it("measures length after trimming, not before", () => {
    // 17 real characters plus surrounding spaces is still a valid tag.
    const padded = `  ${"a".repeat(TAG_MAX_LENGTH)}  `;
    expect(validateNewTag(padded, [])).toEqual({
      ok: true,
      kind: "new",
      tag: "a".repeat(TAG_MAX_LENGTH),
    });
  });

  it("collapses inner whitespace on the returned tag", () => {
    expect(validateNewTag("great   sauce", [])).toEqual({
      ok: true,
      kind: "new",
      tag: "great sauce",
    });
  });

  it("resolves to an existing tag rather than creating a near-duplicate", () => {
    expect(validateNewTag("  great   service ", ["Great Service"])).toEqual({
      ok: true,
      kind: "existing",
      tag: "Great Service",
    });
  });

  it("returns the existing tag's original casing, not the input's", () => {
    const result = validateNewTag("GOOD VARIETY", POPULAR_TAG_POOL);
    expect(result).toEqual({ ok: true, kind: "existing", tag: "Good Variety" });
  });

  it("creates a new tag when nothing matches", () => {
    expect(validateNewTag("birria ramen", POPULAR_TAG_POOL)).toEqual({
      ok: true,
      kind: "new",
      tag: "birria ramen",
    });
  });
});

describe("findExistingTag", () => {
  it("returns null when there is no match", () => {
    expect(findExistingTag("nope", POPULAR_TAG_POOL)).toBeNull();
  });

  it("matches pool entries containing punctuation", () => {
    expect(findExistingTag("not so cheap $$", POPULAR_TAG_POOL)).toBe("Not so Cheap $$");
    expect(findExistingTag("non-authentic", POPULAR_TAG_POOL)).toBe("Non-Authentic");
  });
});

describe("POPULAR_TAG_POOL", () => {
  it("holds the app's 14 curated tags", () => {
    expect(POPULAR_TAG_POOL).toHaveLength(14);
  });

  it("has no entry over the character limit", () => {
    for (const tag of POPULAR_TAG_POOL) {
      expect(tag.length).toBeLessThanOrEqual(TAG_MAX_LENGTH);
    }
  });

  it("contains no duplicates under normalization", () => {
    const keys = POPULAR_TAG_POOL.map(normalizeTag);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
