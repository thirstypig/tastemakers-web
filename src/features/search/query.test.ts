import { describe, expect, it } from "vitest";
import {
  SEARCH_MAX_LENGTH,
  isSearchSegment,
  likePattern,
  sanitizeSearchTerm,
  segmentLabel,
} from "./query";

describe("sanitizeSearchTerm", () => {
  it("passes an ordinary query through", () => {
    expect(sanitizeSearchTerm("girl and the goat")).toBe("girl and the goat");
  });

  it("trims and collapses whitespace", () => {
    expect(sanitizeSearchTerm("  ramen   tatsu ")).toBe("ramen tatsu");
  });

  it("strips the PostgREST or() delimiters", () => {
    // Commas and parens would restructure the filter, not just fail to match.
    expect(sanitizeSearchTerm("a,b")).toBe("a b");
    expect(sanitizeSearchTerm("name.ilike.(x)")).toBe("name.ilike. x");
  });

  it("strips LIKE wildcards so a query cannot widen its own filter", () => {
    // A bare "*" would otherwise match every row.
    expect(sanitizeSearchTerm("*")).toBe("");
    expect(sanitizeSearchTerm("%")).toBe("");
    expect(sanitizeSearchTerm("ta*co")).toBe("ta co");
  });

  it("strips quotes and backslashes", () => {
    expect(sanitizeSearchTerm('say "hi"')).toBe("say hi");
    expect(sanitizeSearchTerm("back\\slash")).toBe("back slash");
    expect(sanitizeSearchTerm("o'brien")).toBe("o brien");
  });

  it("returns empty for whitespace-only input", () => {
    expect(sanitizeSearchTerm("   ")).toBe("");
    expect(sanitizeSearchTerm("")).toBe("");
  });

  it(`caps the term at ${SEARCH_MAX_LENGTH} characters`, () => {
    expect(sanitizeSearchTerm("a".repeat(200))).toHaveLength(SEARCH_MAX_LENGTH);
  });

  it("does not leave trailing whitespace after the cap", () => {
    const input = `${"a".repeat(SEARCH_MAX_LENGTH - 1)} bbbb`;
    expect(sanitizeSearchTerm(input)).toBe("a".repeat(SEARCH_MAX_LENGTH - 1));
  });

  it("keeps characters that are legitimately part of restaurant names", () => {
    expect(sanitizeSearchTerm("Dulan's Soul Food & Kitchen")).toBe("Dulan s Soul Food & Kitchen");
    expect(sanitizeSearchTerm("Non-Authentic")).toBe("Non-Authentic");
    expect(sanitizeSearchTerm("Cheap $")).toBe("Cheap $");
  });
});

describe("likePattern", () => {
  it("wraps the term in PostgREST wildcards", () => {
    expect(likePattern("ramen")).toBe("*ramen*");
  });
});

describe("isSearchSegment", () => {
  it("accepts the three real segments", () => {
    expect(isSearchSegment("restaurants")).toBe(true);
    expect(isSearchSegment("lists")).toBe(true);
    expect(isSearchSegment("tags")).toBe(true);
  });

  it("rejects anything else, including undefined", () => {
    expect(isSearchSegment("people")).toBe(false);
    expect(isSearchSegment(undefined)).toBe(false);
    expect(isSearchSegment("")).toBe(false);
  });
});

describe("segmentLabel", () => {
  it("capitalises each segment", () => {
    expect(segmentLabel("restaurants")).toBe("Restaurants");
    expect(segmentLabel("lists")).toBe("Lists");
    expect(segmentLabel("tags")).toBe("Tags");
  });
});
