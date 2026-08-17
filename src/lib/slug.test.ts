import { describe, expect, it } from "vitest";
import { buildSlug, isCanonicalSlug, parseIdFromSlug, slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Girl & The Goat")).toBe("girl-the-goat");
  });

  it("collapses runs of punctuation into one hyphen", () => {
    expect(slugify("Cluck 2 Go | Hainan Chicken Rice")).toBe("cluck-2-go-hainan-chicken-rice");
    expect(slugify("Domino's Pizza")).toBe("domino-s-pizza");
  });

  it("strips accents rather than the letters under them", () => {
    expect(slugify("Café Gratitude")).toBe("cafe-gratitude");
    expect(slugify("Señor Fish")).toBe("senor-fish");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  — The Hat — ")).toBe("the-hat");
  });

  it("returns empty for a name with no latin characters", () => {
    // 34 production rows look like this.
    expect(slugify("台北市")).toBe("");
    expect(slugify("！！！")).toBe("");
  });

  it("caps length without leaving a trailing hyphen", () => {
    const long = slugify("a".repeat(40) + " " + "b".repeat(40));
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith("-")).toBe(false);
  });
});

describe("buildSlug", () => {
  it("appends the id so chains stay distinct", () => {
    // 14 restaurants share this name in production.
    expect(buildSlug("In-N-Out Burger", 182)).toBe("in-n-out-burger-182");
    expect(buildSlug("In-N-Out Burger", 417)).toBe("in-n-out-burger-417");
  });

  it("falls back to the bare id when the name slugifies to nothing", () => {
    expect(buildSlug("台北市", 900)).toBe("900");
    expect(buildSlug(null, 12)).toBe("12");
    expect(buildSlug(undefined, 12)).toBe("12");
  });
});

describe("parseIdFromSlug", () => {
  it("reads the id off the canonical form", () => {
    expect(parseIdFromSlug("langers-delicatessen-restaurant-159")).toBe("159");
  });

  it("accepts a bare id — the URLs that shipped before slugs", () => {
    expect(parseIdFromSlug("159")).toBe("159");
  });

  it("accepts a stale name with the right id, so renames keep resolving", () => {
    expect(parseIdFromSlug("whatever-it-used-to-be-159")).toBe("159");
  });

  it("takes the trailing id, not a number earlier in the name", () => {
    expect(parseIdFromSlug("cluck-2-go-hainan-chicken-rice-441")).toBe("441");
  });

  it("returns null when there is no trailing id", () => {
    expect(parseIdFromSlug("girl-the-goat")).toBeNull();
    expect(parseIdFromSlug("")).toBeNull();
  });

  it("does not treat a number inside the final word as an id", () => {
    expect(parseIdFromSlug("route66")).toBeNull();
  });
});

describe("isCanonicalSlug", () => {
  it("is true only for the exact canonical form", () => {
    expect(isCanonicalSlug("in-n-out-burger-182", "In-N-Out Burger", 182)).toBe(true);
    // These all resolve, but should redirect rather than serve duplicates.
    expect(isCanonicalSlug("182", "In-N-Out Burger", 182)).toBe(false);
    expect(isCanonicalSlug("old-name-182", "In-N-Out Burger", 182)).toBe(false);
  });
});
