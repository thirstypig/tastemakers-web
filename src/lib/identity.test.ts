import { describe, expect, it, vi } from "vitest";
import { resolveAppUserId } from "./app-user";
import { adminGateDecision } from "./admin-gate";

/**
 * Two web-side auth defects, both of the same family: a security decision made
 * from something the person being checked can influence.
 *
 * ── TODO-092: self-writable identity ────────────────────────────────────────
 *
 * The tag routes took the acting user's app id from Supabase `user_metadata`:
 *
 *     const appUserId = user.user_metadata?.app_user_id as number | undefined;
 *
 * `user_metadata` is writable BY THE USER — a signed-in visitor can call
 * `supabase.auth.updateUser({ data: { app_user_id: 42 } })` with their own anon
 * session and the change sticks. So it is a claim, not an identity, and it was
 * being used to decide who a tag write or DELETE belongs to. Exactly the shape of
 * the backend IDOR (backend todo 006): the actor came from something the caller
 * controls.
 *
 * The identity now comes from the one thing the user cannot rewrite — the email
 * on their verified session — looked up server-side against `public.users`.
 *
 * ── TODO-097: the admin gate fails open ─────────────────────────────────────
 *
 *     const configured = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_ANON_KEY;
 *     if (configured && pathname.startsWith("/admin") ...) { ...gate... }
 *
 * If either variable is missing the gate is SKIPPED and /admin is served to
 * anyone. A missing environment variable should never be the thing that unlocks
 * the admin panel — misconfiguration must deny, not permit.
 */

describe("resolveAppUserId", () => {
  it("ignores a forged app_user_id in user_metadata", async () => {
    const lookup = vi.fn(async () => 42);

    const id = await resolveAppUserId(
      { email: "real@example.test", user_metadata: { app_user_id: 999 } },
      lookup,
    );

    expect(id).toBe(42);
    expect(lookup).toHaveBeenCalledWith("real@example.test");
  });

  it("resolves from the session email even when metadata is absent", async () => {
    const id = await resolveAppUserId({ email: "real@example.test" }, async () => 7);
    expect(id).toBe(7);
  });

  it("returns null when the session carries no email", async () => {
    const lookup = vi.fn(async () => 42);
    expect(await resolveAppUserId({ email: null }, lookup)).toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("returns null when the email maps to no app user", async () => {
    expect(await resolveAppUserId({ email: "ghost@example.test" }, async () => null)).toBeNull();
  });
});

describe("adminGateDecision", () => {
  const allowed = ["admin@example.test"];

  it("denies when Supabase is not configured — misconfiguration must not unlock admin", () => {
    expect(
      adminGateDecision({
        pathname: "/admin/users",
        configured: false,
        userEmail: "admin@example.test",
        allowedEmails: allowed,
      }),
    ).toBe("redirect");
  });

  it("denies an anonymous visitor", () => {
    expect(
      adminGateDecision({ pathname: "/admin/users", configured: true, userEmail: null, allowedEmails: allowed }),
    ).toBe("redirect");
  });

  it("denies a signed-in user who is not on the allowlist", () => {
    expect(
      adminGateDecision({
        pathname: "/admin/users",
        configured: true,
        userEmail: "someone@example.test",
        allowedEmails: allowed,
      }),
    ).toBe("redirect");
  });

  it("allows an allowlisted admin", () => {
    expect(
      adminGateDecision({
        pathname: "/admin/users",
        configured: true,
        userEmail: "admin@example.test",
        allowedEmails: allowed,
      }),
    ).toBe("allow");
  });

  it("leaves the admin login page reachable, or nobody can ever sign in", () => {
    expect(
      adminGateDecision({ pathname: "/admin/login", configured: true, userEmail: null, allowedEmails: allowed }),
    ).toBe("allow");
  });

  it("does not gate non-admin paths", () => {
    expect(
      adminGateDecision({ pathname: "/restaurants", configured: false, userEmail: null, allowedEmails: allowed }),
    ).toBe("allow");
  });

  it("denies when the allowlist is empty rather than admitting everyone", () => {
    expect(
      adminGateDecision({ pathname: "/admin", configured: true, userEmail: "anyone@example.test", allowedEmails: [] }),
    ).toBe("redirect");
  });
});
