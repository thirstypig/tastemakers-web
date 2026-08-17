import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";

describe("NAV_ITEMS", () => {
  it("holds the four items the sidebar and drawer share", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Home",
      "Cuisines",
      "Lists",
      "Bookmarks",
    ]);
  });

  it("does not duplicate the top bar's search field", () => {
    // Widened: the literal union makes the comparison a type error otherwise,
    // which is TypeScript agreeing with the assertion rather than refuting it.
    const hrefs: string[] = NAV_ITEMS.map((i) => i.href);
    expect(hrefs).not.toContain("/search");
  });

  it("leaves identity to the sidebar's bottom slot", () => {
    const hrefs: string[] = NAV_ITEMS.map((i) => i.href);
    expect(hrefs).not.toContain("/profile");
  });
});

describe("isNavItemActive", () => {
  it("matches Home only on the exact root path", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/", "/lists")).toBe(false);
  });

  it("matches a section on its own path", () => {
    expect(isNavItemActive("/lists", "/lists")).toBe(true);
  });

  it("matches a section on its child paths", () => {
    expect(isNavItemActive("/lists", "/lists/38-essential-la")).toBe(true);
  });

  it("does not match a sibling path that merely shares a prefix", () => {
    // The bug a bare startsWith() would introduce.
    expect(isNavItemActive("/lists", "/listsomething")).toBe(false);
  });

  it("keeps exactly one item active for a typical route", () => {
    const active = NAV_ITEMS.filter((i) => isNavItemActive(i.href, "/lists/late-night"));
    expect(active).toHaveLength(1);
    expect(active[0]?.label).toBe("Lists");
  });
});
