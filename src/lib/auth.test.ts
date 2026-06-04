import { describe, it, expect } from "vitest";
import { parseAllowedEmails, isEmailAllowed, safeRedirectPath } from "./auth";

// ── parseAllowedEmails ────────────────────────────────────────────────────────

describe("parseAllowedEmails", () => {
  it("returns empty array for empty string", () => {
    expect(parseAllowedEmails("")).toEqual([]);
  });

  it("parses a single email", () => {
    expect(parseAllowedEmails("admin@example.com")).toEqual(["admin@example.com"]);
  });

  it("parses multiple comma-separated emails", () => {
    expect(parseAllowedEmails("a@x.com,b@x.com,c@x.com")).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
    ]);
  });

  it("trims whitespace around commas", () => {
    // Protects against ADMIN_EMAILS="a@x.com , b@x.com" typos
    expect(parseAllowedEmails("a@x.com , b@x.com")).toEqual(["a@x.com", "b@x.com"]);
  });

  it("lowercases all entries", () => {
    // Protects against case mismatch when Supabase returns mixed-case email
    expect(parseAllowedEmails("Admin@Example.COM")).toEqual(["admin@example.com"]);
  });

  it("filters out blank entries from trailing/double commas", () => {
    expect(parseAllowedEmails("a@x.com,,b@x.com,")).toEqual(["a@x.com", "b@x.com"]);
  });
});

// ── isEmailAllowed ────────────────────────────────────────────────────────────

describe("isEmailAllowed", () => {
  it("allows any email when allowList is empty (open-access mode)", () => {
    // Empty list = ADMIN_EMAILS not set = allow all authenticated users
    expect(isEmailAllowed("anyone@example.com", [])).toBe(true);
    expect(isEmailAllowed(undefined, [])).toBe(true);
  });

  it("allows a listed email", () => {
    expect(isEmailAllowed("owner@example.com", ["owner@example.com"])).toBe(true);
  });

  it("blocks an unlisted email when allowList is non-empty", () => {
    // Protects against a stranger signing in with their own Google account
    expect(isEmailAllowed("stranger@example.com", ["owner@example.com"])).toBe(false);
  });

  it("is case-insensitive for the incoming email", () => {
    // Google may return mixed-case email; allowList is already lowercased by parseAllowedEmails
    expect(isEmailAllowed("Owner@Example.COM", ["owner@example.com"])).toBe(true);
  });

  it("blocks undefined email even when allowList is empty", () => {
    // A user with no email should never be allowed past a non-empty list
    expect(isEmailAllowed(undefined, ["owner@example.com"])).toBe(false);
  });

  it("allows all emails in a multi-entry allowList", () => {
    const list = ["alice@example.com", "bob@example.com"];
    expect(isEmailAllowed("alice@example.com", list)).toBe(true);
    expect(isEmailAllowed("bob@example.com", list)).toBe(true);
    expect(isEmailAllowed("carol@example.com", list)).toBe(false);
  });
});

// ── safeRedirectPath ──────────────────────────────────────────────────────────

describe("safeRedirectPath", () => {
  it("returns a same-origin relative path unchanged", () => {
    expect(safeRedirectPath("/review")).toBe("/review");
  });

  it("preserves nested paths and query strings", () => {
    // The gate sends ?next=/profile/me; querystrings must survive too
    expect(safeRedirectPath("/profile/me")).toBe("/profile/me");
    expect(safeRedirectPath("/lists?sort=new")).toBe("/lists?sort=new");
  });

  it("allows the bare root path", () => {
    expect(safeRedirectPath("/")).toBe("/");
  });

  it("falls back when next is null or empty", () => {
    expect(safeRedirectPath(null)).toBe("/explore");
    expect(safeRedirectPath(undefined)).toBe("/explore");
    expect(safeRedirectPath("")).toBe("/explore");
  });

  it("rejects protocol-relative URLs (the open-redirect the review caught)", () => {
    // router.push("//evil.com") would navigate OFF-SITE — must not pass
    expect(safeRedirectPath("//evil.com")).toBe("/explore");
    expect(safeRedirectPath("//evil.com/path")).toBe("/explore");
  });

  it("rejects the backslash trick browsers normalise to //", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe("/explore");
  });

  it("rejects absolute URLs that don't start with a slash", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/explore");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/explore");
  });

  it("honours a custom fallback", () => {
    // /review uses safeRedirectPath indirectly; callers may want a different default
    expect(safeRedirectPath(null, "/restaurants")).toBe("/restaurants");
    expect(safeRedirectPath("//evil.com", "/restaurants")).toBe("/restaurants");
  });
});
