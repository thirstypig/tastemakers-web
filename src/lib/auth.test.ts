import { describe, it, expect, beforeEach, vi } from "vitest";
import { parseAllowedEmails, isEmailAllowed, safeRedirectPath, resolveCallbackOrigin } from "./auth";

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

  it("filters out blank entries from trailing commas", () => {
    expect(parseAllowedEmails("a@x.com,")).toEqual(["a@x.com"]);
  });
});

// ── isEmailAllowed ────────────────────────────────────────────────────────────

describe("isEmailAllowed", () => {
  it("allows any email when allowList is empty (open access)", () => {
    expect(isEmailAllowed("anyone@example.com", [])).toBe(true);
  });

  it("rejects undefined email with a non-empty allowList", () => {
    expect(isEmailAllowed(undefined, ["admin@example.com"])).toBe(false);
  });

  it("allows email present in the allowList", () => {
    expect(isEmailAllowed("admin@example.com", ["admin@example.com"])).toBe(true);
  });

  it("rejects email not in the allowList", () => {
    expect(isEmailAllowed("stranger@example.com", ["admin@example.com"])).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isEmailAllowed("Admin@Example.COM", ["admin@example.com"])).toBe(true);
  });

  it("rejects when email has a typo vs allowList (jimmyc316 vs jimmychang316)", () => {
    // Regression: ADMIN_EMAILS typo in Railway caused production login loop
    expect(isEmailAllowed("jimmychang316@gmail.com", ["jimmyc316@gmail.com"])).toBe(false);
    expect(isEmailAllowed("jimmychang316@gmail.com", ["jimmychang316@gmail.com"])).toBe(true);
  });
});

// ── safeRedirectPath ──────────────────────────────────────────────────────────

describe("safeRedirectPath", () => {
  it("returns a valid relative path unchanged", () => {
    expect(safeRedirectPath("/admin")).toBe("/admin");
  });

  it("falls back when path is null", () => {
    expect(safeRedirectPath(null)).toBe("/explore");
  });

  it("falls back for absolute URLs (open redirect attempt)", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/explore");
  });

  it("falls back for protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/explore");
  });

  it("falls back for backslash trick", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe("/explore");
  });

  it("honours a custom fallback", () => {
    expect(safeRedirectPath(null, "/home")).toBe("/home");
  });
});

// ── resolveCallbackOrigin ─────────────────────────────────────────────────────

describe("resolveCallbackOrigin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses NEXT_PUBLIC_SITE_URL when set (production Railway case)", () => {
    // Regression: Railway's request.url is localhost:8080 internally.
    // The callback must use the env var, not the internal URL.
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.tastemakersapp.com");
    expect(resolveCallbackOrigin("http://localhost:8080/auth/callback?code=abc"))
      .toBe("https://app.tastemakersapp.com");
  });

  it("strips trailing slash from NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.tastemakersapp.com/");
    expect(resolveCallbackOrigin("http://localhost:8080/auth/callback"))
      .toBe("https://app.tastemakersapp.com");
  });

  it("falls back to request.url origin when NEXT_PUBLIC_SITE_URL is unset (local dev)", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(resolveCallbackOrigin("http://localhost:3050/auth/callback?code=abc"))
      .toBe("http://localhost:3050");
  });

  it("never returns localhost:8080 when NEXT_PUBLIC_SITE_URL is set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://app.tastemakersapp.com");
    const result = resolveCallbackOrigin("http://localhost:8080/auth/callback");
    expect(result).not.toContain("localhost:8080");
    expect(result).toBe("https://app.tastemakersapp.com");
  });
});
