import { describe, expect, it } from "vitest";
import { adminGateDecision } from "./admin-gate";

/**
 * `adminGateDecision` is the only thing standing between the public internet and
 * `/admin`, and it had **no tests** until 2026-08-20 (TODO-097).
 *
 * That matters more than the usual coverage gap because of what it replaced. The
 * middleware used to read:
 *
 *     const configured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;
 *     if (configured && pathname.startsWith("/admin") ...) { ...gate... }
 *
 * — so a missing or misspelled environment variable **skipped the gate** and
 * served the admin panel to anyone. Nothing errors in that state; the panel
 * simply opens. A Railway deploy where env propagation failed would have been
 * world-readable and looked completely healthy.
 *
 * The fix was to deny when identity is unknowable. Nothing guarded the fix, so a
 * later refactor could reinstate the `configured &&` shape and the suite would
 * stay green. These tests are that guard.
 */

const ALLOWED = ["owner@example.com"];

/** The configured, signed-in, allowlisted happy path. Overridden per case. */
const base = {
  pathname: "/admin",
  configured: true,
  userEmail: "owner@example.com",
  allowedEmails: ALLOWED,
};

describe("adminGateDecision — the fail-open regression", () => {
  it("DENIES when Supabase is not configured", () => {
    // The whole point. "We cannot tell who this is" must not mean "come in".
    expect(adminGateDecision({ ...base, configured: false })).toBe("redirect");
  });

  it("denies an unconfigured request even with an email present", () => {
    // Guards a plausible half-fix: trusting a claimed identity when the thing
    // that would verify it is switched off.
    expect(
      adminGateDecision({ ...base, configured: false, userEmail: "owner@example.com" }),
    ).toBe("redirect");
  });

  it("DENIES when the allowlist is empty", () => {
    // `isEmailAllowed` treats an empty list as "everyone" — a fair default for a
    // helper, and the wrong one here. An unset ADMIN_EMAILS must not open the
    // panel to every Google account on earth.
    expect(adminGateDecision({ ...base, allowedEmails: [] })).toBe("redirect");
  });

  it("denies a signed-out visitor", () => {
    expect(adminGateDecision({ ...base, userEmail: null })).toBe("redirect");
    expect(adminGateDecision({ ...base, userEmail: undefined })).toBe("redirect");
  });

  it("denies an authenticated user who is not on the allowlist", () => {
    // Signed in to Supabase is not the same as being the owner.
    expect(adminGateDecision({ ...base, userEmail: "stranger@example.com" })).toBe("redirect");
  });

  it("allows the configured, signed-in, allowlisted owner", () => {
    // Without this the suite would pass by denying everything.
    expect(adminGateDecision(base)).toBe("allow");
  });
});

describe("adminGateDecision — path scoping", () => {
  it("leaves non-admin paths alone", () => {
    for (const pathname of ["/", "/restaurants", "/tastemakers/Thirstypig", "/api/tags/search"]) {
      expect(adminGateDecision({ ...base, configured: false, userEmail: null, pathname })).toBe(
        "allow",
      );
    }
  });

  it("keeps /admin/login reachable, or nobody can ever sign in", () => {
    expect(
      adminGateDecision({ ...base, pathname: "/admin/login", configured: false, userEmail: null }),
    ).toBe("allow");
  });

  it("gates every admin subpath, not just /admin", () => {
    for (const pathname of ["/admin", "/admin/", "/admin/users", "/admin/docs/PRD-001"]) {
      expect(adminGateDecision({ ...base, pathname, userEmail: null })).toBe("redirect");
    }
  });

  it("does not gate a path that merely starts with the letters 'admin'", () => {
    // `/administrators` is not an admin path. Guards a `startsWith("/admin")`
    // written without the trailing slash.
    expect(
      adminGateDecision({ ...base, pathname: "/administrators", userEmail: null }),
    ).toBe("allow");
  });
});
